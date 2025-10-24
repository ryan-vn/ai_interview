import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Resume } from './resume.entity';
import { User } from '../../users/entities/user.entity';

export enum ResumeActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  PARSE = 'parse',
  REPARSE = 'reparse',
  LINK_JOB = 'link_job',
  DOWNLOAD = 'download',
  STATUS_CHANGE = 'status_change',
}

@Entity('resume_audit_logs')
export class ResumeAuditLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '简历ID' })
  @Column({ name: 'resume_id' })
  resumeId: number;

  @ApiProperty({ description: '关联简历', type: () => Resume })
  @ManyToOne(() => Resume)
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @ApiProperty({ description: '操作类型', enum: ResumeActionType })
  @Column({
    type: 'enum',
    enum: ResumeActionType,
  })
  action: ResumeActionType;

  @ApiProperty({ description: '操作人ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: '操作人', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '操作详情' })
  @Column({ type: 'json', nullable: true })
  details: any;

  @ApiProperty({ description: 'IP地址' })
  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string;

  @ApiProperty({ description: '用户代理' })
  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

