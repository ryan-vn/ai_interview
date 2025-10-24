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
import { User } from '../../users/entities/user.entity';

export enum ResumeStatus {
  NEW = 'new',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  HIRED = 'hired',
}

export enum ParseStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

interface Education {
  school: string;
  degree: string;
  major?: string;
  startYear: number;
  endYear: number;
}

interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  years?: number;
}

@Entity('resumes')
export class Resume {
  @ApiProperty({ description: '简历ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '候选人姓名', example: '张三' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @Column({ length: 20, unique: true })
  phone: string;

  @ApiProperty({ description: '邮箱', example: 'zhangsan@example.com' })
  @Column({ length: 100 })
  email: string;

  @ApiProperty({ description: '性别', example: '男', required: false })
  @Column({ length: 10, nullable: true })
  gender: string;

  @ApiProperty({ description: '年龄', example: 28, required: false })
  @Column({ nullable: true })
  age: number;

  @ApiProperty({ description: '技能关键词', type: [String], example: ['Java', 'Spring', 'MySQL'] })
  @Column({ type: 'json', nullable: true })
  skills: string[];

  @ApiProperty({ description: '工作经历', type: 'array', example: [{ company: '阿里巴巴', title: '高级开发', years: 3 }] })
  @Column({ type: 'json', nullable: true })
  experience: Experience[];

  @ApiProperty({ description: '教育经历', type: 'array', example: [{ school: '清华大学', degree: '本科', major: '计算机' }] })
  @Column({ type: 'json', nullable: true })
  education: Education[];

  @ApiProperty({ description: '工作年限', example: 5, required: false })
  @Column({ name: 'years_of_experience', nullable: true })
  yearsOfExperience: number;

  @ApiProperty({ description: '期望薪资', example: '20k-30k', required: false })
  @Column({ name: 'expected_salary', length: 50, nullable: true })
  expectedSalary: string;

  @ApiProperty({ description: '当前状态', enum: ResumeStatus, example: ResumeStatus.NEW })
  @Column({
    type: 'enum',
    enum: ResumeStatus,
    default: ResumeStatus.NEW,
  })
  status: ResumeStatus;

  @ApiProperty({ description: '关联岗位ID', example: 1, required: false })
  @Column({ name: 'job_id', nullable: true })
  jobId: number;

  @ApiProperty({ description: '关联岗位', type: () => Job })
  @ManyToOne(() => Job, { nullable: true })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ description: '简历文件路径', example: '/uploads/resumes/xxx.pdf', required: false })
  @Column({ name: 'file_path', length: 500, nullable: true })
  filePath: string;

  @ApiProperty({ description: '简历文件名', example: '张三_前端开发.pdf', required: false })
  @Column({ name: 'file_name', length: 255, nullable: true })
  fileName: string;

  @ApiProperty({ description: '解析状态', enum: ParseStatus, example: ParseStatus.SUCCESS })
  @Column({
    name: 'parse_status',
    type: 'enum',
    enum: ParseStatus,
    default: ParseStatus.PENDING,
  })
  parseStatus: ParseStatus;

  @ApiProperty({ description: '解析错误信息', required: false })
  @Column({ name: 'parse_error', type: 'text', nullable: true })
  parseError: string;

  @ApiProperty({ description: '简历来源', example: 'upload', required: false })
  @Column({ length: 50, nullable: true, default: 'upload' })
  source: string;

  @ApiProperty({ description: '备注', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: '导入者ID', example: 1 })
  @Column({ name: 'imported_by', nullable: true })
  importedBy: number;

  @ApiProperty({ description: '导入者', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'imported_by' })
  importer: User;

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

