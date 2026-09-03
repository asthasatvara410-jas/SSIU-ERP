import { Injectable } from '@nestjs/common';

@Injectable()
export class ORCIDValidationService {
  /**
   * Normalizes ORCID string into 0000-0000-0000-000X format.
   */
  normalizeORCID(input: string): string {
    if (!input) return '';
    let orcid = input.trim();
    orcid = orcid.replace(/^https?:\/\/orcid\.org\//i, '');
    return orcid.trim();
  }

  /**
   * Validates ORCID format according to ISO 27729 (16 digits with hyphens).
   */
  validateFormat(orcid: string): boolean {
    const canonical = this.normalizeORCID(orcid);
    const regex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;
    return regex.test(canonical);
  }

  async validateORCID(orcid: string): Promise<{ status: 'VERIFIED' | 'NOT_FOUND' | 'ERROR'; canonical: string }> {
    const canonical = this.normalizeORCID(orcid);
    const isValid = this.validateFormat(canonical);

    if (!isValid) {
      return { status: 'NOT_FOUND', canonical };
    }

    return { status: 'VERIFIED', canonical };
  }
}
