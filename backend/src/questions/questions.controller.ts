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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { QuestionImportService } from './question-import.service';
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
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly questionImportService: QuestionImportService,
  ) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '创建题目' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createQuestionDto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.questionsService.create(createQuestionDto, user.userId);
  }

  @Post('import')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量导入题目（JSON格式）' })
  @ApiResponse({ status: 201, description: '导入完成' })
  importQuestions(
    @Body() importDto: ImportQuestionsDto,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.importQuestions(importDto, user.userId);
  }

  @Post('import/file')
  @Roles('admin', 'hr')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '通过CSV/TXT文件批量导入题目' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV或TXT文件（最大10MB）',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '导入完成' })
  async importFromFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    // 检查文件大小（最大10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过10MB');
    }

    // 检查文件格式
    const allowedTypes = ['.csv', '.txt'];
    const fileExt = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
    );
    if (!allowedTypes.includes(fileExt.toLowerCase())) {
      throw new BadRequestException('仅支持CSV或TXT文件');
    }

    // 读取文件内容
    const fileContent = file.buffer.toString('utf-8');

    // 解析文件
    let parseResult;
    if (fileExt.toLowerCase() === '.csv') {
      parseResult = this.questionImportService.parseCSV(fileContent);
    } else {
      parseResult = this.questionImportService.parseTXT(fileContent);
    }

    // 如果解析全部失败，直接返回错误
    if (parseResult.questions.length === 0) {
      return {
        success: false,
        message: '文件解析失败，没有有效的题目数据',
        parseErrors: parseResult.errors,
      };
    }

    // 导入题目
    const importResult = await this.questionsService.importQuestions(
      { questions: parseResult.questions },
      user.userId,
    );

    // 生成导入报告
    const report = this.questionImportService.generateImportReport(
      parseResult,
      importResult,
    );

    return {
      success: true,
      message: '导入完成',
      parseResult: {
        parsedCount: parseResult.questions.length,
        parseErrors: parseResult.errors.length,
      },
      importResult: {
        successCount: importResult.successCount,
        failedCount: importResult.failedCount,
      },
      report,
      errors: [...parseResult.errors, ...importResult.errors],
    };
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
    @CurrentUser() user: any,
  ) {
    return this.questionsService.update(id, updateQuestionDto, user.userId);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '删除题目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '题目不存在' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    await this.questionsService.remove(id, user.userId);
    return { message: '删除成功' };
  }

  @Post('batch-delete')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量删除题目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchRemove(@Body('ids') ids: number[], @CurrentUser() user: any) {
    await this.questionsService.batchRemove(ids, user.userId);
    return { message: '批量删除成功' };
  }
}

