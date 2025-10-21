import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { InterviewSession } from './entities/interview-session.entity';
import { Template } from './entities/template.entity';
import { QuestionsModule } from '../questions/questions.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewSession, Template]),
    QuestionsModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, EmailService],
  exports: [InterviewsService],
})
export class InterviewsModule {}

