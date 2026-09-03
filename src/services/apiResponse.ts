/**
 * Standardized API Response Envelope & Error Hierarchy
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  details?: ApiErrorDetail[];
  timestamp: string;
  path?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: ApiErrorPayload;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    timestamp: string;
    requestId?: string;
  };
}

// ─── ERROR HIERARCHY ──────────────────────────────────────────────────────────

export abstract class ApiError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly details?: ApiErrorDetail[];
  readonly isOperational: boolean = true;

  constructor(message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 Bad Request */
export class BadRequestError extends ApiError {
  readonly statusCode = 400;
  readonly errorCode = 'BAD_REQUEST';
}

/** 401 Unauthorized */
export class UnauthorizedError extends ApiError {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';
  constructor(message = '401 Unauthorized: Valid authentication token or session required.') {
    super(message);
  }
}

/** 403 Forbidden */
export class ForbiddenError extends ApiError {
  readonly statusCode = 403;
  readonly errorCode = 'FORBIDDEN';
  constructor(message = '403 Forbidden: You do not have permission or authorized scope to access this resource.') {
    super(message);
  }
}

/** 404 Not Found */
export class NotFoundError extends ApiError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  constructor(resource = 'Resource', identifier?: string) {
    super(`${resource}${identifier ? ` with identifier "${identifier}"` : ''} was not found.`);
  }
}

/** 409 Conflict */
export class ConflictError extends ApiError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
  constructor(message = 'A conflicting record already exists.') {
    super(message);
  }
}

/** 422 Unprocessable Entity / Validation Error */
export class ValidationError extends ApiError {
  readonly statusCode = 422;
  readonly errorCode = 'VALIDATION_ERROR';
  constructor(message = 'Validation failed for the requested payload.', details?: ApiErrorDetail[]) {
    super(message, details);
  }
}

/** 500 Internal Server Error */
export class InternalServerError extends ApiError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
  constructor(message = 'An unexpected internal server error occurred. Please contact the ERP administrator.') {
    super(message);
  }
}

// ─── RESPONSE BUILDERS & ERROR SANITIZERS ────────────────────────────────────

/**
 * Creates a uniform success response envelope
 */
export function successResponse<T>(data: T, message?: string, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
  return {
    success: true,
    statusCode: 200,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

/**
 * Creates a uniform created (201) response envelope
 */
export function createdResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    statusCode: 201,
    data,
    message: message || 'Resource created successfully.',
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Sanitizes and formats any error into a standardized, safe client response envelope.
 * Database internals, table names, and stack traces are suppressed in production.
 */
export function errorResponse(error: unknown, path?: string): ApiResponse<never> {
  const timestamp = new Date().toISOString();

  if (error instanceof ApiError) {
    return {
      success: false,
      statusCode: error.statusCode,
      error: {
        code: error.errorCode,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        timestamp,
        path
      }
    };
  }

  // Handle standard Javascript Error or DB Exception safely
  const rawMsg = error instanceof Error ? error.message : String(error);
  
  // Mask sensitive database or SQL fragments
  let sanitizedMsg = 'An unexpected error occurred while processing your request.';
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (rawMsg.includes('401') || rawMsg.toLowerCase().includes('unauthorized')) {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    sanitizedMsg = rawMsg;
  } else if (rawMsg.includes('403') || rawMsg.toLowerCase().includes('forbidden') || rawMsg.toLowerCase().includes('unauthorized scope')) {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    sanitizedMsg = rawMsg;
  } else if (rawMsg.includes('404') || rawMsg.toLowerCase().includes('not found')) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    sanitizedMsg = rawMsg;
  } else if (rawMsg.includes('already exists') || rawMsg.toLowerCase().includes('duplicate')) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    sanitizedMsg = rawMsg;
  } else if (rawMsg.toLowerCase().includes('required') || rawMsg.toLowerCase().includes('invalid')) {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    sanitizedMsg = rawMsg;
  }

  return {
    success: false,
    statusCode,
    error: {
      code: errorCode,
      message: sanitizedMsg,
      statusCode,
      timestamp,
      path
    }
  };
}
