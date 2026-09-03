import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // Handle custom message or default message
        let data = result;
        let message = 'Operation completed successfully.';

        if (result && typeof result === 'object' && 'data' in result && 'message' in result && Object.keys(result).length <= 3) {
          data = result.data;
          message = result.message || message;
        }

        return {
          success: true,
          data,
          message,
        };
      }),
    );
  }
}
