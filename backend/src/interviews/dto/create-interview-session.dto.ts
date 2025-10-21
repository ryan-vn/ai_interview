import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsEmail, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateInfoDto {
  @ApiProperty({ description: '候选人姓名', example: '张三' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '候选人邮箱', example: 'zhangsan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '候选人手机号', example: '13800138000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '应聘职位', example: '前端开发工程师', required: false })
  @IsString()
  @IsOptional()
  position?: string;
}

export class InterviewSettingsDto {
  @ApiProperty({ description: '面试时长（分钟）', example: 120, required: false })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: '是否允许重新安排', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  allowReschedule?: boolean;

  @ApiProperty({ description: '是否发送提醒邮件', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;
}

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

  @ApiProperty({ description: '候选人信息', type: CandidateInfoDto })
  @ValidateNested()
  @Type(() => CandidateInfoDto)
  candidateInfo: CandidateInfoDto;

  @ApiProperty({ description: '面试设置', type: InterviewSettingsDto, required: false })
  @ValidateNested()
  @Type(() => InterviewSettingsDto)
  @IsOptional()
  settings?: InterviewSettingsDto;
}

