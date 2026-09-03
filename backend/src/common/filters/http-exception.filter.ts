import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected server error occurred. Please try again later.';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      code = HttpStatus[status] || 'ERROR';

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = res.message || exception.message;
        if (Array.isArray(res.message)) {
          message = 'Validation failed for request parameters.';
          details = res.message;
        } else if (res.error) {
          code = res.error.toUpperCase().replace(/\s+/g, '_');
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected internal server error occurred. Please contact university IT support.';
      } else {
        message = exception.message || message;
      }
    }

    // Additional defense-in-depth: scrub database and driver leaks in production
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      message = 'An unexpected server error occurred. Please contact system support.';
      details = null;
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
