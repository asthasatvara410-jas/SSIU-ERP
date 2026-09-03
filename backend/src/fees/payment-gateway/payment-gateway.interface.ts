export interface CreateGatewayOrderParams {
  orderNumber: string;
  amount: number; // in INR
  currency: string;
  student: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    enrollmentNo: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
  };
  notes?: Record<string, string>;
}

export interface GatewayOrderResponse {
  gatewayOrderId: string;
  gateway: string;
  amount: number;
  currency: string;
  keyId?: string;
  receipt?: string;
  additionalParams?: Record<string, any>;
}

export interface VerifyGatewayPaymentParams {
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature?: string;
  amount?: number;
  currency?: string;
  rawPayload?: any;
}

export interface GatewayVerificationResult {
  isVerified: boolean;
  gatewayPaymentId: string;
  gatewayOrderId?: string;
  paymentMethod: string; // UPI | CARD | NETBANKING | WALLET | ONLINE | OTHER
  amount: number;
  currency: string;
  failureReason?: string;
  rawResponse?: any;
}

export interface PaymentGatewayInterface {
  readonly gatewayName: string;
  getKeyId(): string;
  createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResponse>;
  verifyPayment(params: VerifyGatewayPaymentParams): Promise<GatewayVerificationResult>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, secret?: string): boolean;
}
