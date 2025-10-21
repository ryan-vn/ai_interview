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
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ description: '题目ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '题目类型', enum: QuestionType, example: QuestionType.PROGRAMMING })
  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @ApiProperty({ description: '题目标题', example: '两数之和' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ description: '题目描述', example: '给定一个整数数组和目标值...' })
  @Column('text')
  description: string;

  @ApiProperty({ description: '难度', enum: QuestionDifficulty, example: QuestionDifficulty.MEDIUM })
  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty;

  @ApiProperty({ description: '标签', type: [String], example: ['数组', '哈希表'] })
  @Column({ type: 'json', nullable: true })
  tags: string[];

  @ApiProperty({ description: '支持的编程语言', type: [String], example: ['javascript', 'python'] })
  @Column({ name: 'language_options', type: 'json', nullable: true })
  languageOptions: string[];

  @ApiProperty({ description: '测试用例', example: [{ input: '[2,7,11,15], 9', output: '[0,1]' }] })
  @Column({ name: 'test_cases', type: 'json', nullable: true })
  testCases: any[];

  @ApiProperty({ description: '初始代码模板', example: { javascript: 'function solution() {}' } })
  @Column({ name: 'starter_code', type: 'json', nullable: true })
  starterCode: Record<string, string>;

  @ApiProperty({ description: '时间限制（秒）', example: 60 })
  @Column({ name: 'time_limit', default: 60 })
  timeLimit: number;

  @ApiProperty({ description: '内存限制（MB）', example: 256 })
  @Column({ name: 'memory_limit', default: 256 })
  memoryLimit: number;

  @ApiProperty({ description: '创建者ID', example: 1 })
  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ApiProperty({ description: '创建者', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ApiProperty({ description: '提交记录', type: () => [Submission] })
  @OneToMany(() => Submission, (submission) => submission.question)
  submissions: Submission[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

