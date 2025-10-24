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

export enum JobStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('jobs')
export class Job {
  @ApiProperty({ description: '岗位ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '岗位名称', example: '高级前端开发工程师' })
  @Column({ length: 100 })
  title: string;

  @ApiProperty({ description: '所属部门', example: '技术研发部' })
  @Column({ length: 100 })
  department: string;

  @ApiProperty({ description: '岗位职责', example: '负责公司核心产品的前端开发...' })
  @Column({ type: 'text' })
  responsibilities: string;

  @ApiProperty({ description: '技能要求（用于匹配度计算）', example: 'React, TypeScript, Node.js, 前端工程化' })
  @Column({ type: 'text' })
  requirements: string;

  @ApiProperty({ description: '技能关键词（JSON数组）', type: [String], example: ['React', 'TypeScript', 'Node.js'] })
  @Column({ name: 'skill_keywords', type: 'json', nullable: true })
  skillKeywords: string[];

  @ApiProperty({ description: '招聘人数', example: 2, required: false })
  @Column({ name: 'hiring_count', nullable: true })
  hiringCount: number;

  @ApiProperty({ description: '学历要求', example: '本科及以上', required: false })
  @Column({ name: 'education_requirement', length: 50, nullable: true })
  educationRequirement: string;

  @ApiProperty({ description: '工作年限要求', example: '3-5年', required: false })
  @Column({ name: 'experience_requirement', length: 50, nullable: true })
  experienceRequirement: string;

  @ApiProperty({ description: '薪资范围', example: '20k-35k', required: false })
  @Column({ name: 'salary_range', length: 50, nullable: true })
  salaryRange: string;

  @ApiProperty({ description: '工作地点', example: '北京', required: false })
  @Column({ length: 100, nullable: true })
  location: string;

  @ApiProperty({ description: '岗位状态', enum: JobStatus, example: JobStatus.OPEN })
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.OPEN,
  })
  status: JobStatus;

  @ApiProperty({ description: '创建者ID', example: 1 })
  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ApiProperty({ description: '创建者', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ApiProperty({ description: '是否已删除', example: false })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

