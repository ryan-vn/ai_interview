import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { QuestionImportService } from './question-import.service';
import { AuditLogService } from './audit-log.service';
import { Question } from './entities/question.entity';
import { QuestionTag } from './entities/tag.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionTag, AuditLog])],
  controllers: [QuestionsController, TagsController],
  providers: [QuestionsService, TagsService, QuestionImportService, AuditLogService],
  exports: [QuestionsService, TagsService],
})
export class QuestionsModule {}

