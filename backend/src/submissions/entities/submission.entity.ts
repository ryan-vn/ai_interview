import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id' })
  sessionId: number;

  @ManyToOne(() => InterviewSession, (session) => session.submissions)
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => Question, (question) => question.submissions)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.submissions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ['programming', 'qa'] })
  type: string;

  @Column('text')
  content: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  language: string;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ name: 'execution_time', nullable: true })
  executionTime: number;

  @Column({ name: 'memory_used', nullable: true })
  memoryUsed: number;

  @OneToOne(() => ScoreRecord, (record) => record.submission)
  scoreRecord: ScoreRecord;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}

