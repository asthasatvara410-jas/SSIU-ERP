import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
  api: {
    name: string;
    status: string;
    uptimeSeconds: number;
    version: string;
  };
  database: {
    provider: string;
    status: string;
    connectionError?: string;
  };
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    let dbStatus = 'DISCONNECTED';
    let dbError: string | undefined;

    try {
      // Execute ping query to check live database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'CONNECTED';
    } catch (e: any) {
      dbStatus = 'DISCONNECTED';
      dbError = e.message || 'PostgreSQL database server not reachable on configured port.';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      api: {
        name: 'SSIU ERP Production Backend Services API',
        status: 'UP',
        uptimeSeconds,
        version: '1.0.0'
      },
      database: {
        provider: 'postgresql',
        status: dbStatus,
        connectionError: dbError
      }
    };
  }
}
