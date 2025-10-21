import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '创建题目（管理员/面试官）' })
  create(@Body() createQuestionDto: CreateQuestionDto, @Request() req) {
    return this.questionsService.create(createQuestionDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取所有题目' })
  @ApiQuery({ name: 'type', required: false, enum: ['programming', 'qa'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  findAll(@Query('type') type?: string, @Query('difficulty') difficulty?: string) {
    return this.questionsService.findAll(type, difficulty);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取题目详情' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '更新题目（管理员/面试官）' })
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(+id, updateQuestionDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除题目（仅管理员）' })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(+id);
  }
}

