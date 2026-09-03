import * as crypto from 'crypto';

/**
 * SSIU ERP — DigiLocker Token Encryption Utility (AES-256-GCM)
 * Ensures access and refresh tokens are encrypted at rest on the server.
 */
export class DigiLockerCryptoUtil {
  private static getEncryptionKey(): Buffer {
    const rawKey = process.env.DIGILOCKER_ENCRYPTION_KEY || process.env.JWT_SECRET || 'ssiu-erp-digilocker-secure-default-key-2026';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext token using AES-256-GCM with a random IV and auth tag.
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts AES-256-GCM ciphertext payload.
   */
  static decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) return '';
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }

  /**
   * Masks sensitive credentials in logs and outputs.
   */
  static maskSecret(value?: string | null): string {
    if (!value || value.length < 6) return '******';
    return `${value.slice(0, 3)}****${value.slice(-3)}`;
  }
}
