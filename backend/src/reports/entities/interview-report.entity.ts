import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';

export enum ReportStatus {
  PASS = 'pass',
  FAIL = 'fail',
  PENDING = 'pending',
}

@Entity('interview_reports')
export class InterviewReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', unique: true })
  sessionId: number;

  @OneToOne(() => InterviewSession, (session) => session.report)
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @Column({ name: 'overall_score', type: 'float', nullable: true })
  overallScore: number;

  @Column({ name: 'technical_score', type: 'float', nullable: true })
  technicalScore: number;

  @Column({ name: 'qa_score', type: 'float', nullable: true })
  qaScore: number;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  weaknesses: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

