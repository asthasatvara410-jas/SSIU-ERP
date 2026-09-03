declare const process: any;

/**
 * SSIU ERP - Backend Environment & Runtime Configuration
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test' | 'staging';
  apiBaseUrl: string;
  storageKey: string;
  storageVersion: string;
  sessionTimeoutMinutes: number;
  enableAuditLogging: boolean;
  enableDebugLogging: boolean;
  maxFileUploadBytes: number;
  allowedFileMimeTypes: string[];
}

export const ENV: AppConfig = {
  env: (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development',
  apiBaseUrl: (typeof process !== 'undefined' && process.env?.VITE_API_URL) || 'https://erp.swarrnim.edu.in/api/v1',
  storageKey: 'sscit_erp_master_db_v2',
  storageVersion: '2.4.0',
  sessionTimeoutMinutes: 120,
  enableAuditLogging: true,
  enableDebugLogging: (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'),
  maxFileUploadBytes: 15 * 1024 * 1024, // 15 MB
  allowedFileMimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]
};
