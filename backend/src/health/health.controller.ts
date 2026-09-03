import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthCheckResponse } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  async getHealth(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }

  @Get('api/v1/health')
  async getApiV1Health(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }
}
