import { Injectable, Logger } from '@nestjs/common';
import { ToolDefinition, ToolErrorCode } from './tool.types';

@Injectable()
export class ToolValidationService {
  private readonly logger = new Logger('ToolValidationService');

  private readonly SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /jwt/i,
    /token/i,
    /apiKey/i,
    /privateKey/i,
    /credential/i,
    /bearer\s+[a-zA-Z0-9_\-\.]+/i,
  ];

  private readonly INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|UNION)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
    /(\b(exec|system|spawn|eval|child_process)\b)/i,
    /(<script\b[^>]*>([\s\S]*?)<\/script>)/i,
    /(\.\.\/|\.\.\\)/i, // Path traversal
  ];

  /**
   * Validates tool input against schema and security injection patterns.
   */
  validateInput(tool: ToolDefinition, input: any): { valid: boolean; errorCode?: ToolErrorCode; errorMessage?: string } {
    if (input === undefined || input === null) {
      if (tool.inputSchema && Object.keys(tool.inputSchema.properties || {}).length > 0) {
        return {
          valid: false,
          errorCode: 'INVALID_INPUT',
          errorMessage: 'Tool expects non-empty input payload matching inputSchema.',
        };
      }
      return { valid: true };
    }

    if (typeof input !== 'object') {
      return {
        valid: false,
        errorCode: 'INVALID_INPUT',
        errorMessage: 'Input payload must be a valid JSON object.',
      };
    }

    // Payload size check (Max 5MB)
    const jsonString = JSON.stringify(input);
    if (jsonString.length > 5 * 1024 * 1024) {
      return {
        valid: false,
        errorCode: 'INVALID_INPUT',
        errorMessage: 'Input payload exceeds maximum allowed size (5MB).',
      };
    }

    // Security injection check
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(jsonString)) {
        return {
          valid: false,
          errorCode: 'INVALID_INPUT',
          errorMessage: 'Input contains prohibited or malicious command/query patterns.',
        };
      }
    }

    // Schema required fields check
    if (tool.inputSchema && Array.isArray(tool.inputSchema.required)) {
      for (const requiredField of tool.inputSchema.required) {
        if (input[requiredField] === undefined || input[requiredField] === null || input[requiredField] === '') {
          return {
            valid: false,
            errorCode: 'INVALID_INPUT',
            errorMessage: `Missing required input field: '${requiredField}'.`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Sanitizes output and redacts any accidentally exposed credentials.
   */
  sanitizeOutput(output: any): any {
    if (!output) return output;

    if (typeof output === 'string') {
      let sanitized = output;
      for (const pattern of this.SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
      return sanitized;
    }

    if (Array.isArray(output)) {
      return output.map(item => this.sanitizeOutput(item));
    }

    if (typeof output === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(output)) {
        const isSensitiveKey = this.SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
        if (isSensitiveKey) {
          result[key] = '[REDACTED_CREDENTIAL]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.sanitizeOutput(value);
        } else if (typeof value === 'string') {
          result[key] = this.sanitizeOutput(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return output;
  }
}
