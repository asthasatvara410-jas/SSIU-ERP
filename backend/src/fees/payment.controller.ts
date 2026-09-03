import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreatePaymentOrderDto,
  VerifyPaymentDto,
  CancelPaymentOrderDto,
  RecordPaymentFailureDto,
  PaymentQueryDto,
} from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Online Fee Payments')
@Controller('api/v1')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Step 1: Create Payment Order
   * POST /api/v1/payments/orders
   */
  @Post('payments/orders')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Create a payment gateway order for an outstanding Fee Invoice' })
  async createPaymentOrder(@Body() dto: CreatePaymentOrderDto, @Req() req: any) {
    return this.paymentService.createPaymentOrder(dto, req.user);
  }

  /**
   * Step 2: Verify and Settle Payment (Idempotent)
   * POST /api/v1/payments/verify
   */
  @Post('payments/verify')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Verify gateway payment signature and settle invoice balance atomically' })
  async verifyPayment(@Body() dto: VerifyPaymentDto, @Req() req: any) {
    return this.paymentService.verifyPayment(dto, req.user);
  }

  /**
   * User cancelled payment at gateway
   * POST /api/v1/payments/cancel
   */
  @Post('payments/cancel')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Record payment order cancellation without altering fee balance' })
  async cancelPaymentOrder(@Body() dto: CancelPaymentOrderDto, @Req() req: any) {
    return this.paymentService.cancelPaymentOrder(dto, req.user);
  }

  /**
   * Record payment failure from gateway
   * POST /api/v1/payments/fail
   */
  @Post('payments/fail')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Record payment gateway failure with safe reason' })
  async recordPaymentFailure(@Body() dto: RecordPaymentFailureDto, @Req() req: any) {
    return this.paymentService.recordPaymentFailure(dto, req.user);
  }

  /**
   * Gateway Webhook Endpoint (Signature verified)
   * POST /api/v1/payments/webhook
   */
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle asynchronous gateway webhooks with signature verification' })
  async handleWebhook(
    @Body() rawBody: any,
    @Headers('x-razorpay-signature') razorpaySignature: string,
    @Headers() headers: any,
  ) {
    return this.paymentService.handleWebhook(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      razorpaySignature || headers['x-signature'] || '',
      headers,
    );
  }

  /**
   * List Payment Transactions (with RBAC & Search Filters)
   * GET /api/v1/payments
   */
  @Get('payments')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List and search payment transactions with pagination' })
  async getPayments(@Query() query: PaymentQueryDto, @Req() req: any) {
    return this.paymentService.getPayments(query, req.user);
  }

  /**
   * Overview Payment Metrics (for dashboard preparation)
   * GET /api/v1/payments/metrics
   */
  @Get('payments/metrics')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Overview financial metrics on transactions and collections' })
  async getPaymentMetrics() {
    return this.paymentService.getPaymentOverviewMetrics();
  }

  /**
   * Get Logged-in Student's Payment History
   * GET /api/v1/students/me/payments
   */
  @Get('students/me/payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated student payment history' })
  async getMyPayments(@Req() req: any) {
    return this.paymentService.getMyPayments(req.user);
  }

  /**
   * Get Single Payment Transaction by ID
   * GET /api/v1/payments/:id
   */
  @Get('payments/:id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get payment transaction detail by ID' })
  async getPaymentById(@Param('id') id: string, @Req() req: any) {
    return this.paymentService.getPaymentById(id, req.user);
  }

  /**
   * Get Invoice Payment Settlement Status
   * GET /api/v1/invoices/:id/payment-status
   */
  @Get('invoices/:id/payment-status')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get live payment and outstanding status of an invoice' })
  async getInvoicePaymentStatus(@Param('id') invoiceId: string, @Req() req: any) {
    return this.paymentService.getInvoicePaymentStatus(invoiceId, req.user);
  }
}
