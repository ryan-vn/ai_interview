import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ description: '面试场次ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  sessionId: number;

  @ApiProperty({ description: '题目ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  questionId: number;

  @ApiProperty({ description: '提交内容（代码或答案）' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: '编程语言',
    example: 'javascript',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;
}

