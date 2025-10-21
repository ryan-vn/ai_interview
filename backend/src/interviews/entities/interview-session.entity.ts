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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'template_id' })
  templateId: number;

  @ManyToOne(() => Template)
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column({ name: 'candidate_id' })
  candidateId: number;

  @ManyToOne(() => User, (user) => user.candidateSessions)
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'interviewer_id', nullable: true })
  interviewerId: number;

  @ManyToOne(() => User, (user) => user.interviewerSessions)
  @JoinColumn({ name: 'interviewer_id' })
  interviewer: User;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ name: 'actual_start_at', type: 'timestamp', nullable: true })
  actualStartAt: Date;

  @Column({ name: 'actual_end_at', type: 'timestamp', nullable: true })
  actualEndAt: Date;

  @OneToMany(() => Submission, (submission) => submission.session)
  submissions: Submission[];

  @OneToOne(() => InterviewReport, (report) => report.session)
  report: InterviewReport;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

