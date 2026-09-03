import { Injectable } from '@nestjs/common';
import { PaymentGatewayInterface } from './payment-gateway.interface';
import { RazorpayGatewayProvider } from './providers/razorpay-gateway.provider';

@Injectable()
export class PaymentGatewayService {
  private readonly providers: Map<string, PaymentGatewayInterface> = new Map();
  private defaultGatewayName = 'RAZORPAY';

  constructor() {
    const razorpay = new RazorpayGatewayProvider();
    this.providers.set(razorpay.gatewayName, razorpay);
  }

  getGateway(gatewayName?: string): PaymentGatewayInterface {
    const name = (gatewayName || this.defaultGatewayName).toUpperCase();
    const provider = this.providers.get(name);
    if (!provider) {
      // Fallback to default
      return this.providers.get(this.defaultGatewayName)!;
    }
    return provider;
  }

  registerProvider(provider: PaymentGatewayInterface) {
    this.providers.set(provider.gatewayName.toUpperCase(), provider);
  }
}
