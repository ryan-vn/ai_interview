import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { Resume } from './entities/resume.entity';
import { ResumeAuditLog } from './entities/resume-audit-log.entity';
import { ResumeAuditService } from './resume-audit.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume, ResumeAuditLog]),
    forwardRef(() => AiModule),
  ],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeAuditService],
  exports: [ResumesService, ResumeAuditService],
})
export class ResumesModule {}

