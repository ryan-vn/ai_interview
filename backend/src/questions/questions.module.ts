import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { Question } from './entities/question.entity';
import { QuestionTag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionTag])],
  controllers: [QuestionsController, TagsController],
  providers: [QuestionsService, TagsService],
  exports: [QuestionsService, TagsService],
})
export class QuestionsModule {}

