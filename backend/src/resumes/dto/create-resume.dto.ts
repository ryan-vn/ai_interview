import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ResumeStatus } from '../entities/resume.entity';

export class CreateResumeDto {
  @ApiProperty({ description: '候选人姓名', example: '张三' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '邮箱', example: 'zhangsan@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '性别', example: '男', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  gender?: string;

  @ApiProperty({ description: '年龄', example: 28, required: false })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiProperty({
    description: '技能关键词',
    type: [String],
    example: ['Java', 'Spring', 'MySQL'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiProperty({
    description: '工作经历',
    type: 'array',
    example: [
      {
        company: '阿里巴巴',
        title: '高级开发',
        startDate: '2020-01',
        endDate: '2023-06',
        years: 3,
      },
    ],
    required: false,
  })
  @IsOptional()
  experience?: any[];

  @ApiProperty({
    description: '教育经历',
    type: 'array',
    example: [
      {
        school: '清华大学',
        degree: '本科',
        major: '计算机科学与技术',
        startYear: 2015,
        endYear: 2019,
      },
    ],
    required: false,
  })
  @IsOptional()
  education?: any[];

  @ApiProperty({ description: '工作年限', example: 5, required: false })
  @IsNumber()
  @IsOptional()
  yearsOfExperience?: number;

  @ApiProperty({ description: '期望薪资', example: '20k-30k', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  expectedSalary?: string;

  @ApiProperty({
    description: '当前状态',
    enum: ResumeStatus,
    example: ResumeStatus.NEW,
    required: false,
  })
  @IsEnum(ResumeStatus)
  @IsOptional()
  status?: ResumeStatus;

  @ApiProperty({ description: '关联岗位ID', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  jobId?: number;

  @ApiProperty({ description: '简历来源', example: 'upload', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  source?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

