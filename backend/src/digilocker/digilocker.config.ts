import { Injectable, Logger } from '@nestjs/common';

export type DigiLockerEnvironmentMode = 'production' | 'sandbox' | 'demo_sandbox';

@Injectable()
export class DigiLockerConfig {
  private readonly logger = new Logger(DigiLockerConfig.name);

  get isEnabled(): boolean {
    return process.env.DIGILOCKER_ENABLED === 'true';
  }

  get environment(): DigiLockerEnvironmentMode {
    const env = (process.env.DIGILOCKER_ENVIRONMENT || '').toLowerCase();
    if (env === 'production') return 'production';
    if (env === 'sandbox') return 'sandbox';
    return 'demo_sandbox';
  }

  get baseUrl(): string {
    return (
      process.env.DIGILOCKER_API_BASE_URL ||
      process.env.DIGILOCKER_BASE_URL ||
      'https://api.digitallocker.gov.in/public/oauth2/1'
    );
  }

  get authorizeUrl(): string {
    return (
      process.env.DIGILOCKER_AUTHORIZE_URL ||
      `${this.baseUrl}/authorize`
    );
  }

  get tokenUrl(): string {
    return (
      process.env.DIGILOCKER_TOKEN_URL ||
      `${this.baseUrl}/token`
    );
  }

  get clientId(): string {
    return process.env.DIGILOCKER_CLIENT_ID || '';
  }

  get clientSecret(): string {
    return process.env.DIGILOCKER_CLIENT_SECRET || '';
  }

  get redirectUri(): string {
    return process.env.DIGILOCKER_REDIRECT_URI || 'https://erp.ssiu.ac.in/api/v1/digilocker/callback';
  }

  get issuerId(): string {
    return process.env.DIGILOCKER_ISSUER_ID || 'IN-GJ-SSIU-001';
  }

  /**
   * Validates production configuration readiness.
   * If production is enabled but required keys are absent, reports clear error state.
   */
  validateConfiguration(): {
    valid: boolean;
    mode: 'PRODUCTION_CONFIGURED' | 'READY_FOR_PRODUCTION' | 'DEMO_SANDBOX';
    missingKeys: string[];
    details: string;
  } {
    const missing: string[] = [];
    if (!this.clientId) missing.push('DIGILOCKER_CLIENT_ID');
    if (!this.clientSecret) missing.push('DIGILOCKER_CLIENT_SECRET');
    if (!this.redirectUri) missing.push('DIGILOCKER_REDIRECT_URI');

    if (this.isEnabled && this.environment === 'production') {
      if (missing.length > 0) {
        this.logger.error(
          `[DigiLocker Config] Production mode enabled but missing mandatory credentials: ${missing.join(', ')}`,
        );
        return {
          valid: false,
          mode: 'READY_FOR_PRODUCTION',
          missingKeys: missing,
          details: `Production mode is enabled but mandatory Partner credentials are missing: ${missing.join(', ')}. Official API Setu onboarding required.`,
        };
      }
      return {
        valid: true,
        mode: 'PRODUCTION_CONFIGURED',
        missingKeys: [],
        details: 'Official DigiLocker production credentials and endpoints are fully configured and validated.',
      };
    }

    return {
      valid: true,
      mode: 'DEMO_SANDBOX',
      missingKeys: missing,
      details: 'Operating in Demo Sandbox mode (Safe testing environment).',
    };
  }
}
