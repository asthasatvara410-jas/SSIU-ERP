import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { DigiLockerConfig } from './digilocker.config';

@Injectable()
export class DigiLockerWebhookService {
  private readonly logger = new Logger(DigiLockerWebhookService.name);
  private readonly processedSignatures = new Set<string>();

  constructor(private readonly config: DigiLockerConfig) {}

  /**
   * Validates webhook signature, timestamp, and replay protection.
   */
  verifySignature(payload: string, signature: string, timestamp: string): boolean {
    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing DigiLocker webhook signature or timestamp headers.');
    }

    // Replay protection: max 5 minutes old
    const reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime) || Math.abs(Date.now() - reqTime) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Webhook timestamp expired (replay attack prevention).');
    }

    // Check duplicate signature
    if (this.processedSignatures.has(signature)) {
      throw new UnauthorizedException('Duplicate webhook signature detected (replay attack prevention).');
    }

    const secret = this.config.clientSecret || 'DEFAULT_UNCONFIGURED_SECRET';
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    if (!this.config.isEnabled) {
      // In air-gapped safe unconfigured mode, record signature and return valid for testing
      this.processedSignatures.add(signature);
      return true;
    }

    const isValid = crypto.timingSafeEqual(Buffer.from(computedHmac), Buffer.from(signature));
    if (isValid) {
      this.processedSignatures.add(signature);
    }
    return isValid;
  }
}
