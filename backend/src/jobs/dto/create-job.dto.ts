import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { JobStatus } from '../entities/job.entity';

export class CreateJobDto {
  @ApiProperty({ description: '岗位名称', example: '高级前端开发工程师' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: '所属部门', example: '技术研发部' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  department: string;

  @ApiProperty({ description: '岗位职责', example: '负责公司核心产品的前端开发...' })
  @IsString()
  @IsNotEmpty()
  responsibilities: string;

  @ApiProperty({ description: '技能要求', example: 'React, TypeScript, Node.js, 前端工程化' })
  @IsString()
  @IsNotEmpty()
  requirements: string;

  @ApiProperty({ description: '技能关键词', type: [String], example: ['React', 'TypeScript', 'Node.js'], required: false })
  @IsArray()
  @IsOptional()
  skillKeywords?: string[];

  @ApiProperty({ description: '招聘人数', example: 2, required: false })
  @IsNumber()
  @IsOptional()
  hiringCount?: number;

  @ApiProperty({ description: '学历要求', example: '本科及以上', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  educationRequirement?: string;

  @ApiProperty({ description: '工作年限要求', example: '3-5年', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  experienceRequirement?: string;

  @ApiProperty({ description: '薪资范围', example: '20k-35k', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  salaryRange?: string;

  @ApiProperty({ description: '工作地点', example: '北京', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ description: '岗位状态', enum: JobStatus, example: JobStatus.OPEN, required: false })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}

