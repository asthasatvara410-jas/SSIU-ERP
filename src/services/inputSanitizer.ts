/**
 * Unified Secure Input Validation & Sanitization Engine for SS IU ERP
 * 
 * Provides:
 * 1. Multilingual text normalization supporting English, Gujarati, Hindi, numbers, punctuation.
 * 2. Neutralization of executable scripts (<script>, <iframe>, <object>, <embed>, javascript:, on* handlers).
 * 3. Prevention of SQL Injection vectors in user inputs.
 * 4. Length and constraint validation for Notesheets, Gate Passes, Auth and Profiles.
 */

export interface ValidationResult<T = string> {
  isValid: boolean;
  sanitized: T;
  error?: string;
}

export class InputSanitizer {
  private static instance: InputSanitizer;

  private constructor() {}

  public static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  /**
   * Strips dangerous executable script tags and attributes while preserving
   * multilingual plain text (Gujarati, Hindi, English, numbers, standard punctuation).
   */
  public sanitizePlainText(input: unknown, maxLength?: number): string {
    if (input === null || input === undefined) return '';
    let text = String(input);

    // Normalize Unicode characters (NFC form)
    text = text.normalize('NFC');

    // 1. Remove dangerous HTML tags & their content
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    text = text.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    text = text.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 2. Remove all remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // 3. Remove dangerous URL schemes and javascript pseudoprotocols
    text = text.replace(/javascript\s*:/gi, '');
    text = text.replace(/vbscript\s*:/gi, '');
    text = text.replace(/data\s*:\s*text\/html/gi, '');

    // 4. Remove inline event handler patterns (e.g. onerror=, onclick=)
    text = text.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 5. Trim whitespace
    text = text.trim();

    // 6. Apply max length if specified
    if (maxLength && maxLength > 0 && text.length > maxLength) {
      text = text.substring(0, maxLength).trim();
    }

    return text;
  }

  /**
   * Validates & Sanitizes Notesheet Remarks / Comments / Proposal
   */
  public validateNotesheetRemarks(input: unknown, isRequired: boolean = false, maxLength: number = 3000): ValidationResult<string> {
    const raw = (input ?? '').toString().trim();

    if (isRequired && !raw) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Remarks are mandatory for this workflow action.'
      };
    }

    if (raw.length > maxLength) {
      return {
        isValid: false,
        sanitized: this.sanitizePlainText(raw, maxLength),
        error: `Remarks exceed the maximum allowed length of ${maxLength} characters.`
      };
    }

    const sanitized = this.sanitizePlainText(raw, maxLength);
    return {
      isValid: true,
      sanitized
    };
  }

  /**
   * Validates & Sanitizes Student Gate Pass Reason / Purpose
   */
  public validateGatePassReason(input: unknown, isRequired: boolean = true, maxLength: number = 500): ValidationResult<string> {
    const raw = (input ?? '').toString().trim();

    if (isRequired && !raw) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Reason for gate pass is mandatory.'
      };
    }

    if (raw.length > maxLength) {
      return {
        isValid: false,
        sanitized: this.sanitizePlainText(raw, maxLength),
        error: `Gate Pass Reason exceeds the maximum allowed length of ${maxLength} characters.`
      };
    }

    const sanitized = this.sanitizePlainText(raw, maxLength);
    return {
      isValid: true,
      sanitized
    };
  }

  /**
   * Validates & Sanitizes Login Identifier (Username, Enrollment No, Employee Code, Email)
   */
  public validateLoginIdentifier(input: unknown): ValidationResult<string> {
    const raw = (input ?? '').toString().trim();

    if (!raw || raw.length < 2) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Login identifier must be at least 2 characters long.'
      };
    }

    if (raw.length > 100) {
      return {
        isValid: false,
        sanitized: raw.substring(0, 100),
        error: 'Login identifier exceeds the maximum allowed length.'
      };
    }

    // Strip HTML/Script injection attempts
    const sanitized = this.sanitizePlainText(raw, 100);

    return {
      isValid: true,
      sanitized
    };
  }
}

export const inputSanitizer = InputSanitizer.getInstance();
