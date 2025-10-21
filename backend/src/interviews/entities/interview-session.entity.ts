import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Template } from './template.entity';
import { Submission } from '../../submissions/entities/submission.entity';
import { InterviewReport } from '../../reports/entities/interview-report.entity';

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('interview_sessions')
export class InterviewSession {
  @ApiProperty({ description: '面试场次ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '面试名称', example: '张三-前端工程师面试' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '模板ID', example: 1 })
  @Column({ name: 'template_id' })
  templateId: number;

  @ApiProperty({ description: '面试模板', type: () => Template })
  @ManyToOne(() => Template)
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @ApiProperty({ description: '候选人ID', example: 1 })
  @Column({ name: 'candidate_id' })
  candidateId: number;

  @ApiProperty({ description: '候选人', type: () => User })
  @ManyToOne(() => User, (user) => user.candidateSessions)
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @ApiProperty({ description: '面试官ID', example: 2, required: false })
  @Column({ name: 'interviewer_id', nullable: true })
  interviewerId: number;

  @ApiProperty({ description: '面试官', type: () => User })
  @ManyToOne(() => User, (user) => user.interviewerSessions)
  @JoinColumn({ name: 'interviewer_id' })
  interviewer: User;

  @ApiProperty({ description: '面试状态', enum: InterviewStatus, example: InterviewStatus.SCHEDULED })
  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @ApiProperty({ description: '预约时间', example: '2024-01-01T10:00:00Z' })
  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @ApiProperty({ description: '实际开始时间', required: false })
  @Column({ name: 'actual_start_at', type: 'timestamp', nullable: true })
  actualStartAt: Date;

  @ApiProperty({ description: '实际结束时间', required: false })
  @Column({ name: 'actual_end_at', type: 'timestamp', nullable: true })
  actualEndAt: Date;

  @ApiProperty({ description: '提交记录列表', type: () => [Submission] })
  @OneToMany(() => Submission, (submission) => submission.session)
  submissions: Submission[];

  @ApiProperty({ description: '面试报告', type: () => InterviewReport })
  @OneToOne(() => InterviewReport, (report) => report.session)
  report: InterviewReport;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

