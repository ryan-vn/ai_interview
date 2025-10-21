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
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Role } from './role.entity';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';
import { Submission } from '../../submissions/entities/submission.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @Column({ unique: true, length: 50 })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @Column({ unique: true, length: 100 })
  email: string;

  @ApiHideProperty()
  @Column()
  @Exclude()
  password: string;

  @ApiProperty({ description: '角色ID', example: 1 })
  @Column({ name: 'role_id' })
  roleId: number;

  @ApiProperty({ description: '用户角色', type: () => Role })
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ApiProperty({ description: '头像URL', example: 'https://example.com/avatar.jpg', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @ApiProperty({ description: '是否激活', example: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: '作为候选人的面试场次', type: () => [InterviewSession] })
  @OneToMany(() => InterviewSession, (session) => session.candidate)
  candidateSessions: InterviewSession[];

  @ApiProperty({ description: '作为面试官的面试场次', type: () => [InterviewSession] })
  @OneToMany(() => InterviewSession, (session) => session.interviewer)
  interviewerSessions: InterviewSession[];

  @ApiProperty({ description: '提交记录', type: () => [Submission] })
  @OneToMany(() => Submission, (submission) => submission.user)
  submissions: Submission[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

