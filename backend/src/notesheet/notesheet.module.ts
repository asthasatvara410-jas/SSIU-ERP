import { Module } from '@nestjs/common';
import { NoteSheetController } from './notesheet.controller';
import { NoteSheetService } from './notesheet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [NoteSheetController],
  providers: [NoteSheetService],
  exports: [NoteSheetService],
})
export class NoteSheetModule {}
