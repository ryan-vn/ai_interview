import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Submission } from '../../submissions/entities/submission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('score_records')
export class ScoreRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'submission_id' })
  submissionId: number;

  @OneToOne(() => Submission, (submission) => submission.scoreRecord)
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;

  @Column({ name: 'ai_score', type: 'float', nullable: true })
  aiScore: number;

  @Column({ name: 'ai_feedback', type: 'text', nullable: true })
  aiFeedback: string;

  @Column({ name: 'human_score', type: 'float', nullable: true })
  humanScore: number;

  @Column({ name: 'human_feedback', type: 'text', nullable: true })
  humanFeedback: string;

  @Column({ name: 'final_score', type: 'float', nullable: true })
  finalScore: number;

  @Column({ name: 'scored_by', nullable: true })
  scoredBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'scored_by' })
  scorer: User;

  @CreateDateColumn({ name: 'scored_at' })
  scoredAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

