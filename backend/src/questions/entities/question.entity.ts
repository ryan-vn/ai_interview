import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Submission } from '../../submissions/entities/submission.entity';

export enum QuestionType {
  PROGRAMMING = 'programming',
  QA = 'qa',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'language_options', type: 'json', nullable: true })
  languageOptions: string[];

  @Column({ name: 'test_cases', type: 'json', nullable: true })
  testCases: any[];

  @Column({ name: 'starter_code', type: 'json', nullable: true })
  starterCode: Record<string, string>;

  @Column({ name: 'time_limit', default: 60 })
  timeLimit: number;

  @Column({ name: 'memory_limit', default: 256 })
  memoryLimit: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Submission, (submission) => submission.question)
  submissions: Submission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

