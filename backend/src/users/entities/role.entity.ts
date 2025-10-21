import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @ApiProperty({ description: '角色ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '角色名称', example: 'candidate' })
  @Column({ unique: true, length: 50 })
  name: string;

  @ApiProperty({ description: '角色描述', example: '候选人角色' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @ApiProperty({ description: '该角色的用户列表', type: () => [User] })
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

