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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ImportQuestionsDto } from './dto/import-questions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('题库管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '创建题目' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createQuestionDto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.questionsService.create(createQuestionDto, user.userId);
  }

  @Post('import')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量导入题目' })
  @ApiResponse({ status: 201, description: '导入完成' })
  importQuestions(
    @Body() importDto: ImportQuestionsDto,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.importQuestions(importDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取题目列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['programming', 'qa', 'behavioral', 'technical_qa'],
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: ['easy', 'medium', 'hard'],
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: '标签（逗号分隔）',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '搜索关键词',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
    @Query('tags') tags?: string,
    @Query('keyword') keyword?: string,
  ) {
    const tagsArray = tags ? tags.split(',') : undefined;
    return this.questionsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      type,
      difficulty,
      tagsArray,
      keyword,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取题库统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStatistics() {
    return this.questionsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取题目详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '题目不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '更新题目' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '题目不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '删除题目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '题目不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionsService.remove(id);
    return { message: '删除成功' };
  }

  @Post('batch-delete')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量删除题目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchRemove(@Body('ids') ids: number[]) {
    await this.questionsService.batchRemove(ids);
    return { message: '批量删除成功' };
  }
}

