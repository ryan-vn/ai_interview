import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { QuestionType, QuestionDifficulty } from '../entities/question.entity';

export class CreateQuestionDto {
  @ApiProperty({ description: '题目类型', enum: QuestionType })
  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @ApiProperty({ description: '题目标题', example: '两数之和' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '题目描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '难度',
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  @IsEnum(QuestionDifficulty)
  @IsOptional()
  difficulty?: QuestionDifficulty;

  @ApiProperty({
    description: '标签',
    type: [String],
    example: ['数组', '哈希表'],
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: '支持的编程语言',
    type: [String],
    example: ['javascript', 'python'],
  })
  @IsArray()
  @IsOptional()
  languageOptions?: string[];

  @ApiProperty({ description: '测试用例', type: 'array', required: false })
  @IsArray()
  @IsOptional()
  testCases?: any[];

  @ApiProperty({
    description: '初始代码模板',
    type: 'object',
    required: false,
  })
  @IsObject()
  @IsOptional()
  starterCode?: Record<string, string>;

  @ApiProperty({ description: '时间限制（秒）', default: 60 })
  @IsNumber()
  @IsOptional()
  timeLimit?: number;

  @ApiProperty({ description: '内存限制（MB）', default: 256 })
  @IsNumber()
  @IsOptional()
  memoryLimit?: number;
}

