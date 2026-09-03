import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to PostgreSQL Database via Prisma ORM');
    } catch (error) {
      this.isConnected = false;
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`PostgreSQL Database connection warning: ${errMessage}`);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Disconnected Prisma Client from PostgreSQL Database');
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}
