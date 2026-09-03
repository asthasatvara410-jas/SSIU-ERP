import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AbcValidatorService {
  /**
   * Normalizes and validates an ABC / APAAR ID.
   * Format: Exactly 12 alphanumeric characters, formatted as XXX-XXXX-XXXXX or XXXXXXXXXXXX
   */
  validateAndNormalize(rawAbcId: string): string {
    if (!rawAbcId || typeof rawAbcId !== 'string') {
      throw new BadRequestException('ABC ID is required and must be a valid string');
    }

    const trimmed = rawAbcId.trim();
    if (!trimmed) {
      throw new BadRequestException('ABC ID cannot be blank or whitespace');
    }

    // Strip hyphens and spaces
    const clean = trimmed.replace(/[\s-]/g, '').toUpperCase();

    // Check alphanumeric length of 12
    if (!/^[A-Z0-9]{12}$/.test(clean)) {
      throw new BadRequestException(
        'Invalid ABC ID format: Must be exactly 12 alphanumeric characters (e.g. ABC-123456789012 or 123456789012)',
      );
    }

    // Return canonical formatted string
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 12)}`;
  }
}
