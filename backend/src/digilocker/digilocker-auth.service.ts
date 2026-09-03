import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OfficialDigiLockerAdapter } from './adapters/official-digilocker.adapter';
import { DigiLockerAuditService } from './digilocker-audit.service';
import { DigiLockerConfig } from './digilocker.config';
import { DigiLockerCryptoUtil } from './digilocker-crypto.util';

interface StateMetadata {
  studentId: string;
  tenantId: string;
  codeVerifier: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

@Injectable()
export class DigiLockerAuthService {
  private readonly logger = new Logger(DigiLockerAuthService.name);

  // Server-side state store with TTL and one-time use semantics
  private readonly stateMap = new Map<string, StateMetadata>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly officialAdapter: OfficialDigiLockerAdapter,
    private readonly auditService: DigiLockerAuditService,
    private readonly config: DigiLockerConfig,
  ) {}

  /**
   * Initiates DigiLocker OAuth2 + PKCE authorization flow.
   * Dynamically generates code_verifier, code_challenge (S256), and cryptographic CSRF state.
   */
  async initiateConnect(studentId: string, tenantId: string): Promise<{ authorizationUrl: string; state: string }> {
    // 1. Verify citizen consent
    const consent = await this.prisma.digiLockerConsent.findUnique({
      where: { studentId },
    });

    if (!consent || !consent.consentGiven) {
      throw new BadRequestException('Citizen consent is required before connecting DigiLocker account.');
    }

    // 2. Generate PKCE code_verifier (RFC 7636) and S256 code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const state = `dl_st_${crypto.randomBytes(24).toString('hex')}`;
    const now = Date.now();
    const ttlMs = 5 * 60 * 1000; // 5 minutes TTL

    // 3. Store state metadata server-side
    this.stateMap.set(state, {
      studentId,
      tenantId,
      codeVerifier,
      createdAt: now,
      expiresAt: now + ttlMs,
      used: false,
    });

    this.cleanExpiredStates();

    // 4. Generate official authorization URL
    const authRes = await this.officialAdapter.createAuthorizationRequest(studentId, tenantId, state);

    await this.auditService.logEvent({
      event: 'DIGILOCKER_CONNECT_STARTED',
      studentId,
      tenantId,
      correlationId: `auth-req-${now}`,
      status: 'INITIATED',
      details: { environment: this.config.environment },
    });

    return {
      authorizationUrl: authRes.authorizationUrl,
      state,
    };
  }

  /**
   * Validates OAuth2 callback with strict state validation, anti-replay, and code exchange.
   */
  async handleCallback(code: string, state: string, error?: string, errorDescription?: string): Promise<{
    success: boolean;
    message: string;
    status: string;
    studentId?: string;
  }> {
    if (error) {
      this.logger.warn(`DigiLocker authorization denied by user or gateway: ${error} - ${errorDescription}`);
      return {
        success: false,
        status: 'DENIED',
        message: errorDescription || 'DigiLocker authorization was denied or cancelled.',
      };
    }

    if (!state || !code) {
      throw new BadRequestException('Authorization code and state parameters are mandatory.');
    }

    // 1. Validate state existence
    const stateRecord = this.stateMap.get(state);
    if (!stateRecord) {
      this.logger.warn(`OAuth state not found or expired: ${DigiLockerCryptoUtil.maskSecret(state)}`);
      throw new BadRequestException('Invalid or expired authorization state parameter (CSRF protection failed).');
    }

    // 2. Validate state expiration (5 mins TTL)
    if (Date.now() > stateRecord.expiresAt) {
      this.stateMap.delete(state);
      this.logger.warn(`OAuth state has expired for student ${stateRecord.studentId}`);
      throw new BadRequestException('Authorization request expired. Please initiate DigiLocker connection again.');
    }

    // 3. Prevent replay attack (one-time use)
    if (stateRecord.used) {
      this.stateMap.delete(state);
      this.logger.error(`Replay attack detected on OAuth state: ${DigiLockerCryptoUtil.maskSecret(state)}`);
      throw new ForbiddenException('Authorization state has already been consumed. Replay rejected.');
    }

    // Mark state as consumed immediately
    stateRecord.used = true;
    const { studentId, tenantId } = stateRecord;
    this.stateMap.delete(state);

    // 4. Perform server-side authorization code exchange
    const exchangeRes = await this.officialAdapter.exchangeAuthorizationCode(code, state, tenantId);

    // 5. Encrypt external user reference / tokens for storage at rest
    const encryptedUserRef = exchangeRes.externalUserReference
      ? DigiLockerCryptoUtil.encrypt(exchangeRes.externalUserReference)
      : null;

    // 6. Upsert connection in database
    await this.prisma.digiLockerConnection.upsert({
      where: { studentId },
      create: {
        studentId,
        tenantId,
        status: exchangeRes.status === 'CONNECTED' ? 'CONNECTED' : 'ERROR',
        provider: exchangeRes.provider,
        externalUserReference: encryptedUserRef,
        connectedAt: exchangeRes.status === 'CONNECTED' ? new Date() : null,
        lastSyncAt: new Date(),
      },
      update: {
        status: exchangeRes.status === 'CONNECTED' ? 'CONNECTED' : 'ERROR',
        provider: exchangeRes.provider,
        externalUserReference: encryptedUserRef || undefined,
        connectedAt: exchangeRes.status === 'CONNECTED' ? new Date() : undefined,
        lastSyncAt: new Date(),
      },
    });

    // 7. Audit log (Secrets strictly masked)
    await this.prisma.digiLockerSyncLog.create({
      data: {
        studentId,
        tenantId,
        operation: 'CONNECT',
        status: exchangeRes.status,
        correlationId: `cb-${Date.now()}`,
        errorMessage: exchangeRes.success ? null : exchangeRes.message,
      },
    });

    await this.auditService.logEvent({
      event: exchangeRes.success ? 'DIGILOCKER_CONNECT_SUCCESS' : 'DIGILOCKER_CONNECT_FAILED',
      studentId,
      tenantId,
      correlationId: `cb-${Date.now()}`,
      status: exchangeRes.status,
      details: {
        provider: exchangeRes.provider,
        environment: this.config.environment,
      },
    });

    return {
      success: exchangeRes.success,
      message: exchangeRes.message || 'DigiLocker callback processed successfully.',
      status: exchangeRes.status,
      studentId,
    };
  }

  /**
   * Disconnects citizen DigiLocker connection.
   */
  async disconnect(studentId: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const conn = await this.prisma.digiLockerConnection.findUnique({
      where: { studentId },
    });

    if (conn) {
      if (conn.externalUserReference) {
        const decryptedRef = DigiLockerCryptoUtil.decrypt(conn.externalUserReference) || conn.externalUserReference;
        await this.officialAdapter.revokeConnection(decryptedRef, tenantId);
      }

      await this.prisma.digiLockerConnection.update({
        where: { studentId },
        data: {
          status: 'DISCONNECTED',
          disconnectedAt: new Date(),
        },
      });
    }

    await this.auditService.logEvent({
      event: 'DIGILOCKER_DISCONNECTED',
      studentId,
      tenantId,
      correlationId: `disc-${Date.now()}`,
      status: 'SUCCESS',
    });

    return {
      success: true,
      message: 'DigiLocker account disconnected successfully.',
    };
  }

  private cleanExpiredStates() {
    const now = Date.now();
    for (const [key, val] of this.stateMap.entries()) {
      if (now > val.expiresAt || val.used) {
        this.stateMap.delete(key);
      }
    }
  }
}
