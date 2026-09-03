import { ENV } from '../config/env';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface StructuredLog {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: string;
  userId?: string;
  role?: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class EnterpriseLogger {
  private formatLog(level: LogLevel, message: string, context?: string, data?: any, error?: Error): StructuredLog {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      context: context || 'Application',
      data: this.sanitizeData(data),
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: ENV.enableDebugLogging ? error.stack : undefined
          }
        : undefined
    };
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const clone = Array.isArray(data) ? [...data] : { ...data };
    
    // Mask sensitive fields
    const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'apiKey'];
    for (const key of Object.keys(clone)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        clone[key] = '***MASKED***';
      } else if (typeof clone[key] === 'object') {
        clone[key] = this.sanitizeData(clone[key]);
      }
    }
    return clone;
  }

  public debug(message: string, context?: string, data?: any): void {
    if (!ENV.enableDebugLogging) return;
    const log = this.formatLog('DEBUG', message, context, data);
    console.debug(`[DEBUG][${log.context}] ${log.message}`, log.data || '');
  }

  public info(message: string, context?: string, data?: any): void {
    const log = this.formatLog('INFO', message, context, data);
    console.info(`[INFO][${log.context}] ${log.message}`, log.data || '');
  }

  public warn(message: string, context?: string, data?: any): void {
    const log = this.formatLog('WARN', message, context, data);
    console.warn(`[WARN][${log.context}] ${log.message}`, log.data || '');
  }

  public error(message: string, context?: string, error?: Error, data?: any): void {
    const log = this.formatLog('ERROR', message, context, data, error);
    console.error(`[ERROR][${log.context}] ${log.message}`, log.error || log.data || '');
  }

  public audit(action: string, module: string, details: string, user?: { name?: string; role?: string }): void {
    if (!ENV.enableAuditLogging) return;
    const log = this.formatLog('AUDIT', `[${module}] ${action}: ${details}`, module, { user });
    console.info(`[AUDIT][${module}] ${action} by ${user?.name || 'System'} (${user?.role || 'SYSTEM'}) - ${details}`);
  }
}

export const logger = new EnterpriseLogger();
