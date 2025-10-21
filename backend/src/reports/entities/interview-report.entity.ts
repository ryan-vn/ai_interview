import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';

export enum ReportStatus {
  PASS = 'pass',
  FAIL = 'fail',
  PENDING = 'pending',
}

@Entity('interview_reports')
export class InterviewReport {
  @ApiProperty({ description: '报告ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '面试场次ID', example: 1 })
  @Column({ name: 'session_id', unique: true })
  sessionId: number;

  @ApiProperty({ description: '面试场次', type: () => InterviewSession })
  @OneToOne(() => InterviewSession, (session) => session.report)
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @ApiProperty({ description: '总体得分', example: 82.5, required: false })
  @Column({ name: 'overall_score', type: 'float', nullable: true })
  overallScore: number;

  @ApiProperty({ description: '技术得分', example: 85.0, required: false })
  @Column({ name: 'technical_score', type: 'float', nullable: true })
  technicalScore: number;

  @ApiProperty({ description: '问答得分', example: 80.0, required: false })
  @Column({ name: 'qa_score', type: 'float', nullable: true })
  qaScore: number;

  @ApiProperty({ description: '面试结果', enum: ReportStatus, example: ReportStatus.PASS })
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @ApiProperty({ description: '总结', example: '候选人展现出良好的编程能力...', required: false })
  @Column({ type: 'text', nullable: true })
  summary: string;

  @ApiProperty({ description: '建议', example: '建议加强算法基础的学习', required: false })
  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @ApiProperty({ description: '优势', example: '代码风格良好，逻辑清晰', required: false })
  @Column({ type: 'text', nullable: true })
  strengths: string;

  @ApiProperty({ description: '劣势', example: '时间复杂度分析能力有待提高', required: false })
  @Column({ type: 'text', nullable: true })
  weaknesses: string;

  @ApiProperty({ description: '生成时间' })
  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

