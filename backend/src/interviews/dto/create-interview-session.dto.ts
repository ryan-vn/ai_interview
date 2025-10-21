import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateInterviewSessionDto {
  @ApiProperty({ description: '面试名称', example: '前端工程师面试' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '模板ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  templateId: number;

  @ApiProperty({ description: '面试官ID', example: 2, required: false })
  @IsNumber()
  @IsOptional()
  interviewerId?: number;

  @ApiProperty({ description: '预约时间', example: '2024-01-01T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: Date;
}

