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
import { User } from '../../users/entities/user.entity';

@Entity('templates')
export class Template {
  @ApiProperty({ description: '模板ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '模板名称', example: '前端工程师面试模板' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '模板描述', example: '包含算法和前端框架题目' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '题目ID列表', type: [Number], example: [1, 2, 3] })
  @Column({ name: 'question_ids', type: 'json' })
  questionIds: number[];

  @ApiProperty({ description: '时间限制（秒）', example: 3600 })
  @Column({ name: 'time_limit', default: 3600 })
  timeLimit: number;

  @ApiProperty({ description: '面试说明', example: '请在规定时间内完成所有题目' })
  @Column({ type: 'text', nullable: true })
  instructions: string;

  @ApiProperty({ description: '创建者ID', example: 2 })
  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ApiProperty({ description: '创建者', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

