import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentGatewayService } from './payment-gateway/payment-gateway.service';
import { ReceiptController } from './receipt.controller';
import { ReceiptService } from './receipt.service';
import { LateFeeController } from './late-fee.controller';
import { LateFeeService } from './late-fee.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [LateFeeController, ReceiptController, PaymentController, FeesController],
  providers: [FeesService, PaymentService, PaymentGatewayService, ReceiptService, LateFeeService],
  exports: [FeesService, PaymentService, PaymentGatewayService, ReceiptService, LateFeeService],
})
export class FeesModule {}
