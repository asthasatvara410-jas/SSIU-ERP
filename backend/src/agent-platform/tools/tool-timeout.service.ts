import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolTimeoutService {
  /**
   * Wraps a promise with a hard timeout.
   */
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000,
    errorMessage: string = 'Tool execution exceeded time limit.',
  ): Promise<T> {
    let timer: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`EXECUTION_TIMEOUT: ${errorMessage} (${timeoutMs}ms)`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }
}
