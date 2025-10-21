import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Max } from 'class-validator';

export class UpdateScoreDto {
  @ApiProperty({ description: '评分（0-100）', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ description: '评分反馈' })
  @IsString()
  feedback: string;
}

