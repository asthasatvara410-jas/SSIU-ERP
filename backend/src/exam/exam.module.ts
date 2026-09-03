import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { QuestionBankController } from './question-bank.controller';
import { ExamService } from './exam.service';
import { QuestionBankService } from './question-bank.service';
import { ExamPaperService } from './exam-paper.service';
import { ExamAuditService } from './exam-audit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { NoteSheetModule } from '../notesheet/notesheet.module';

@Module({
  imports: [PrismaModule, RbacModule, NoteSheetModule],
  controllers: [ExamController, QuestionBankController],
  providers: [ExamService, QuestionBankService, ExamPaperService, ExamAuditService],
  exports: [ExamService, QuestionBankService, ExamPaperService, ExamAuditService],
})
export class ExamModule {}

