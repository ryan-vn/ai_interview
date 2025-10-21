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
import { ApiProperty } from '@nestjs/swagger';
import { Submission } from '../../submissions/entities/submission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('score_records')
export class ScoreRecord {
  @ApiProperty({ description: '评分记录ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '提交记录ID', example: 1 })
  @Column({ name: 'submission_id' })
  submissionId: number;

  @ApiProperty({ description: '提交记录', type: () => Submission })
  @OneToOne(() => Submission, (submission) => submission.scoreRecord)
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;

  @ApiProperty({ description: 'AI 评分', example: 85.5, required: false })
  @Column({ name: 'ai_score', type: 'float', nullable: true })
  aiScore: number;

  @ApiProperty({ description: 'AI 反馈', example: '代码实现正确，但可以优化时间复杂度', required: false })
  @Column({ name: 'ai_feedback', type: 'text', nullable: true })
  aiFeedback: string;

  @ApiProperty({ description: '人工评分', example: 90.0, required: false })
  @Column({ name: 'human_score', type: 'float', nullable: true })
  humanScore: number;

  @ApiProperty({ description: '人工反馈', example: '思路清晰，代码质量高', required: false })
  @Column({ name: 'human_feedback', type: 'text', nullable: true })
  humanFeedback: string;

  @ApiProperty({ description: '最终得分', example: 87.75, required: false })
  @Column({ name: 'final_score', type: 'float', nullable: true })
  finalScore: number;

  @ApiProperty({ description: '评分人ID', example: 2, required: false })
  @Column({ name: 'scored_by', nullable: true })
  scoredBy: number;

  @ApiProperty({ description: '评分人', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'scored_by' })
  scorer: User;

  @ApiProperty({ description: '评分时间' })
  @CreateDateColumn({ name: 'scored_at' })
  scoredAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

