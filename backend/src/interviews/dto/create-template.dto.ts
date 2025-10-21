import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称', example: '前端初级面试模板' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '模板描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '题目ID列表',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNotEmpty()
  questionIds: number[];

  @ApiProperty({ description: '时间限制（秒）', default: 3600 })
  @IsNumber()
  @IsOptional()
  timeLimit?: number;

  @ApiProperty({ description: '面试说明', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}

