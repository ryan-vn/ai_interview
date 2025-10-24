import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UploadResumeDto {
  @ApiProperty({
    description: '关联岗位ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  jobId?: number;
}

