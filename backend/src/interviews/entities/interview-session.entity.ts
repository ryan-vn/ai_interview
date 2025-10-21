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

  @ApiProperty({ description: '候选人ID', example: 1, required: false })
  @Column({ name: 'candidate_id', nullable: true })
  candidateId: number;

  @ApiProperty({ description: '候选人', type: () => User, required: false })
  @ManyToOne(() => User, (user) => user.candidateSessions)
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @ApiProperty({ description: '候选人姓名', example: '张三' })
  @Column({ name: 'candidate_name', length: 100 })
  candidateName: string;

  @ApiProperty({ description: '候选人邮箱', example: 'zhangsan@example.com' })
  @Column({ name: 'candidate_email', length: 100 })
  candidateEmail: string;

  @ApiProperty({ description: '候选人手机号', example: '13800138000', required: false })
  @Column({ name: 'candidate_phone', length: 20, nullable: true })
  candidatePhone: string;

  @ApiProperty({ description: '应聘职位', example: '前端开发工程师', required: false })
  @Column({ name: 'position', length: 100, nullable: true })
  position: string;

  @ApiProperty({ description: '面试邀请链接', example: 'https://interview.example.com/invite/abc123' })
  @Column({ name: 'invite_token', length: 255, unique: true })
  inviteToken: string;

  @ApiProperty({ description: '面试链接过期时间', example: '2024-01-01T12:00:00Z' })
  @Column({ name: 'invite_expires_at', type: 'timestamp' })
  inviteExpiresAt: Date;

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

