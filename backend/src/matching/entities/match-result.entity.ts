import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Job } from '../../jobs/entities/job.entity';
import { Resume } from '../../resumes/entities/resume.entity';

@Entity('match_results')
export class MatchResult {
  @ApiProperty({ description: '匹配结果ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '简历ID', example: 1 })
  @Column({ name: 'resume_id' })
  resumeId: number;

  @ApiProperty({ description: '简历', type: () => Resume })
  @ManyToOne(() => Resume)
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @ApiProperty({ description: '岗位ID', example: 1 })
  @Column({ name: 'job_id' })
  jobId: number;

  @ApiProperty({ description: '岗位', type: () => Job })
  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ description: '匹配度分值（0-100）', example: 87.5 })
  @Column({ type: 'float' })
  score: number;

  @ApiProperty({ description: '匹配的关键词', type: [String], example: ['Java', 'Spring', 'MySQL'] })
  @Column({ name: 'matched_keywords', type: 'json', nullable: true })
  matchedKeywords: string[];

  @ApiProperty({ description: '缺失的关键词', type: [String], example: ['Kafka', 'Redis'] })
  @Column({ name: 'missing_keywords', type: 'json', nullable: true })
  missingKeywords: string[];

  @ApiProperty({ description: '匹配详情说明', required: false })
  @Column({ type: 'text', nullable: true })
  details: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

