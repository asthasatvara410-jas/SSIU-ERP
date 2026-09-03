import { Module } from '@nestjs/common';
import { CoreMastersService } from './core-masters.service';
import { CoreMastersController } from './core-masters.controller';
import { SupabaseMastersService } from './supabase-masters.service';
import { SupabaseMastersController } from './supabase-masters.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CoreMastersController, SupabaseMastersController],
  providers: [CoreMastersService, SupabaseMastersService],
  exports: [CoreMastersService, SupabaseMastersService],
})
export class CoreMastersModule {}

