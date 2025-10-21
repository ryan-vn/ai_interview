import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { InterviewReport } from './entities/interview-report.entity';
import { ScoreRecord } from './entities/score-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewReport, ScoreRecord])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

