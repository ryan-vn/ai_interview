import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export class ImportQuestionsDto {
  @ApiProperty({
    description: '题目列表',
    type: [CreateQuestionDto],
    example: [
      {
        type: 'qa',
        title: '请描述一次团队合作的经历',
        description: '详细说明你在团队中的角色、遇到的挑战以及最终结果',
        difficulty: 'medium',
        tags: ['行为面试', '团队协作'],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class ImportResultDto {
  @ApiProperty({ description: '成功导入数量', example: 10 })
  successCount: number;

  @ApiProperty({ description: '失败数量', example: 2 })
  failedCount: number;

  @ApiProperty({ description: '失败详情', type: [Object], example: [] })
  errors: Array<{
    index: number;
    data: any;
    error: string;
  }>;
}

