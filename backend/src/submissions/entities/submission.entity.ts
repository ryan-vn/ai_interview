import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';
import { Question } from '../../questions/entities/question.entity';
import { User } from '../../users/entities/user.entity';
import { ScoreRecord } from '../../reports/entities/score-record.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  ERROR = 'error',
}

@Entity('submissions')
export class Submission {
  @ApiProperty({ description: '提交记录ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '面试场次ID', example: 1 })
  @Column({ name: 'session_id' })
  sessionId: number;

  @ApiProperty({ description: '面试场次', type: () => InterviewSession })
  @ManyToOne(() => InterviewSession, (session) => session.submissions)
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @ApiProperty({ description: '题目ID', example: 1 })
  @Column({ name: 'question_id' })
  questionId: number;

  @ApiProperty({ description: '题目', type: () => Question })
  @ManyToOne(() => Question, (question) => question.submissions)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ApiProperty({ description: '用户ID（访客时为null）', example: 1, required: false })
  @Column({ name: 'user_id', nullable: true })
  userId: number | null;

  @ApiProperty({ description: '用户', type: () => User, required: false })
  @ManyToOne(() => User, (user) => user.submissions, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '题目类型', enum: ['programming', 'qa'], example: 'programming' })
  @Column({ type: 'enum', enum: ['programming', 'qa'] })
  type: string;

  @ApiProperty({ description: '提交内容（代码或答案）', example: 'function solution() { return [0, 1]; }' })
  @Column('text')
  content: string;

  @ApiProperty({ description: '编程语言', example: 'javascript', required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  language: string;

  @ApiProperty({ description: '执行结果', example: { passed: 2, failed: 0, total: 2 } })
  @Column({ type: 'json', nullable: true })
  result: any;

  @ApiProperty({ description: '提交状态', enum: SubmissionStatus, example: SubmissionStatus.SUCCESS })
  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @ApiProperty({ description: '得分', example: 85.5 })
  @Column({ type: 'float', default: 0 })
  score: number;

  @ApiProperty({ description: '执行时间（毫秒）', example: 125, required: false })
  @Column({ name: 'execution_time', nullable: true })
  executionTime: number;

  @ApiProperty({ description: '内存使用（MB）', example: 45, required: false })
  @Column({ name: 'memory_used', nullable: true })
  memoryUsed: number;

  @ApiProperty({ description: '评分记录', type: () => ScoreRecord })
  @OneToOne(() => ScoreRecord, (record) => record.submission)
  scoreRecord: ScoreRecord;

  @ApiProperty({ description: '提交时间' })
  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}

