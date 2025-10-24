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

export enum TagCategory {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  MANAGEMENT = 'management',
  OTHER = 'other',
}

@Entity('question_tags')
export class QuestionTag {
  @ApiProperty({ description: '标签ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '标签名称', example: '前端技能' })
  @Column({ length: 50, unique: true })
  name: string;

  @ApiProperty({ description: '标签分类', enum: TagCategory, example: TagCategory.TECHNICAL })
  @Column({
    type: 'enum',
    enum: TagCategory,
    default: TagCategory.TECHNICAL,
  })
  category: TagCategory;

  @ApiProperty({ description: '标签颜色', example: '#3B82F6', required: false })
  @Column({ length: 20, nullable: true })
  color: string;

  @ApiProperty({ description: '父标签ID', example: 1, required: false })
  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @ApiProperty({ description: '父标签', type: () => QuestionTag, required: false })
  @ManyToOne(() => QuestionTag, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: QuestionTag;

  @ApiProperty({ description: '标签描述', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

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

