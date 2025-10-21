import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    private questionsService: QuestionsService,
  ) {}

  async create(
    createDto: CreateSubmissionDto,
    userId: number,
  ): Promise<Submission> {
    // 获取题目信息
    const question = await this.questionsService.findOne(createDto.questionId);

    const submission = this.submissionsRepository.create({
      ...createDto,
      userId,
      type: question.type,
      status: SubmissionStatus.PENDING,
    });

    const saved = await this.submissionsRepository.save(submission);

    // 异步执行测试和评分
    this.executeAndScore(saved.id).catch(console.error);

    return saved;
  }

  async findAll(sessionId?: number, userId?: number): Promise<Submission[]> {
    const queryBuilder =
      this.submissionsRepository.createQueryBuilder('submission');

    if (sessionId) {
      queryBuilder.andWhere('submission.sessionId = :sessionId', { sessionId });
    }

    if (userId) {
      queryBuilder.andWhere('submission.userId = :userId', { userId });
    }

    queryBuilder
      .leftJoinAndSelect('submission.question', 'question')
      .leftJoinAndSelect('submission.user', 'user')
      .orderBy('submission.submittedAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Submission> {
    const submission = await this.submissionsRepository.findOne({
      where: { id },
      relations: ['question', 'user', 'session'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  private async executeAndScore(submissionId: number): Promise<void> {
    const submission = await this.findOne(submissionId);

    // 更新状态为运行中
    submission.status = SubmissionStatus.RUNNING;
    await this.submissionsRepository.save(submission);

    try {
      if (submission.type === 'programming') {
        // 执行代码测试
        const result = await this.executeCode(submission);
        submission.result = result;
        submission.score = this.calculateProgrammingScore(result);
        submission.status = SubmissionStatus.SUCCESS;
      } else if (submission.type === 'qa') {
        // AI 评分（这里简化处理，实际应调用 AI 服务）
        const score = await this.scoreQA(submission.content);
        submission.score = score;
        submission.status = SubmissionStatus.SUCCESS;
      }
    } catch (error) {
      submission.status = SubmissionStatus.ERROR;
      submission.result = { error: error.message };
    }

    await this.submissionsRepository.save(submission);
  }

  private async executeCode(submission: Submission): Promise<any> {
    // TODO: 实现代码执行沙箱
    // 这里返回模拟结果
    const testCases = submission.question.testCases || [];
    const passedCount = Math.floor(Math.random() * testCases.length);

    return {
      totalTests: testCases.length,
      passedTests: passedCount,
      failedTests: testCases.length - passedCount,
      details: testCases.map((tc, idx) => ({
        input: tc.input,
        expected: tc.output,
        actual: idx < passedCount ? tc.output : 'wrong',
        passed: idx < passedCount,
      })),
    };
  }

  private calculateProgrammingScore(result: any): number {
    if (!result.totalTests) return 0;
    return (result.passedTests / result.totalTests) * 100;
  }

  private async scoreQA(content: string): Promise<number> {
    // TODO: 实现 AI 评分
    // 这里返回模拟分数
    const length = content.length;
    if (length < 50) return 60;
    if (length < 200) return 75;
    return 85 + Math.random() * 15;
  }
}

