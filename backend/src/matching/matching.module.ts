import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { MatchResult } from './entities/match-result.entity';
import { Job } from '../jobs/entities/job.entity';
import { Resume } from '../resumes/entities/resume.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MatchResult, Job, Resume])],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}

