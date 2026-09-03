import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentOrderStatusEnum {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentTransactionStatusEnum {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class CreatePaymentOrderDto {
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  gateway?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentOrderId!: string;

  @IsString()
  @IsNotEmpty()
  gatewayOrderId!: string;

  @IsString()
  @IsNotEmpty()
  gatewayPaymentId!: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class CancelPaymentOrderDto {
  @IsString()
  @IsNotEmpty()
  paymentOrderId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RecordPaymentFailureDto {
  @IsString()
  @IsNotEmpty()
  paymentOrderId!: string;

  @IsOptional()
  @IsString()
  gatewayPaymentId?: string;

  @IsString()
  @IsNotEmpty()
  failureReason!: string;
}

export class PaymentQueryDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;
}
