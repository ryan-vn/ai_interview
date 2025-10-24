import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { TagCategory } from '../entities/tag.entity';

export class CreateTagDto {
  @ApiProperty({ description: '标签名称', example: '前端技能' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: '标签分类',
    enum: TagCategory,
    example: TagCategory.TECHNICAL,
    required: false,
  })
  @IsEnum(TagCategory)
  @IsOptional()
  category?: TagCategory;

  @ApiProperty({ description: '标签颜色', example: '#3B82F6', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiProperty({ description: '父标签ID', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ description: '标签描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

