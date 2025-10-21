import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewReport, ReportStatus } from './entities/interview-report.entity';
import { ScoreRecord } from './entities/score-record.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(InterviewReport)
    private reportsRepository: Repository<InterviewReport>,
    @InjectRepository(ScoreRecord)
    private scoreRecordsRepository: Repository<ScoreRecord>,
  ) {}

  async generateReport(sessionId: number): Promise<InterviewReport> {
    // 检查是否已有报告
    let report = await this.reportsRepository.findOne({
      where: { sessionId },
    });

    if (report) {
      return report;
    }

    // TODO: 从提交记录计算分数和生成报告
    report = this.reportsRepository.create({
      sessionId,
      overallScore: 0,
      technicalScore: 0,
      qaScore: 0,
      status: ReportStatus.PENDING,
    });

    return this.reportsRepository.save(report);
  }

  async findBySession(sessionId: number): Promise<InterviewReport> {
    const report = await this.reportsRepository.findOne({
      where: { sessionId },
      relations: ['session'],
    });

    if (!report) {
      throw new NotFoundException(
        `Report for session ${sessionId} not found`,
      );
    }

    return report;
  }

  async updateReport(
    id: number,
    updateData: Partial<InterviewReport>,
  ): Promise<InterviewReport> {
    const report = await this.reportsRepository.findOne({ where: { id } });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    Object.assign(report, updateData);
    return this.reportsRepository.save(report);
  }

  async createScoreRecord(data: Partial<ScoreRecord>): Promise<ScoreRecord> {
    const record = this.scoreRecordsRepository.create(data);
    return this.scoreRecordsRepository.save(record);
  }

  async updateScoreRecord(
    submissionId: number,
    humanScore: number,
    humanFeedback: string,
    scorerId: number,
  ): Promise<ScoreRecord> {
    let record = await this.scoreRecordsRepository.findOne({
      where: { submissionId },
    });

    if (!record) {
      record = this.scoreRecordsRepository.create({
        submissionId,
        humanScore,
        humanFeedback,
        scoredBy: scorerId,
        finalScore: humanScore,
      });
    } else {
      record.humanScore = humanScore;
      record.humanFeedback = humanFeedback;
      record.scoredBy = scorerId;
      record.finalScore = humanScore;
    }

    return this.scoreRecordsRepository.save(record);
  }
}

