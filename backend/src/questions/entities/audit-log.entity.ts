import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  IMPORT = 'import',
  BATCH_DELETE = 'batch_delete',
}

export enum AuditModule {
  QUESTION = 'question',
  TAG = 'tag',
}

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '模块', enum: AuditModule })
  @Column({
    type: 'enum',
    enum: AuditModule,
  })
  module: AuditModule;

  @ApiProperty({ description: '操作动作', enum: AuditAction })
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({ description: '目标ID（题目ID或标签ID）' })
  @Column({ name: 'target_id', nullable: true })
  targetId: number;

  @ApiProperty({ description: '目标名称' })
  @Column({ name: 'target_name', type: 'text', nullable: true })
  targetName: string;

  @ApiProperty({ description: '操作详情' })
  @Column({ type: 'json', nullable: true })
  details: any;

  @ApiProperty({ description: '操作前数据' })
  @Column({ name: 'old_data', type: 'json', nullable: true })
  oldData: any;

  @ApiProperty({ description: '操作后数据' })
  @Column({ name: 'new_data', type: 'json', nullable: true })
  newData: any;

  @ApiProperty({ description: '操作人ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: '操作人', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'IP地址' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiProperty({ description: '用户代理' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @ApiProperty({ description: '操作时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

