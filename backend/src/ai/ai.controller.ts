import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('AI服务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-resume')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'AI解析简历文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '解析成功' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async parseResume(@UploadedFile() file: Express.Multer.File) {
    const result = await this.aiService.parseResume(file.path);
    return {
      success: true,
      data: result,
      message: '简历解析成功',
    };
  }

  @Post('generate-question-tags')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '为题目生成标签' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateQuestionTags(
    @Body('title') title: string,
    @Body('description') description: string,
  ) {
    const tags = await this.aiService.generateQuestionTags(title, description);
    return {
      success: true,
      data: { tags },
      message: '标签生成成功',
    };
  }

  @Post('generate-questions')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'AI生成面试题目' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateQuestions(
    @Body('jobTitle') jobTitle: string,
    @Body('requirements') requirements: string,
    @Body('count') count: number = 5,
  ) {
    const questions = await this.aiService.generateInterviewQuestions(
      jobTitle,
      requirements,
      count,
    );
    return {
      success: true,
      data: { questions },
      message: `成功生成${questions.length}道题目`,
    };
  }

  @Post('recommend-questions')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '推荐面试题目' })
  @ApiResponse({ status: 200, description: '推荐成功' })
  async recommendQuestions(
    @Body('jobTitle') jobTitle: string,
    @Body('requirements') requirements: string,
    @Body('availableQuestions')
    availableQuestions: Array<{
      id: number;
      title: string;
      description: string;
      tags: string[];
    }>,
    @Body('limit') limit: number = 10,
  ) {
    const questionIds = await this.aiService.recommendQuestionsForJob(
      jobTitle,
      requirements,
      availableQuestions,
      limit,
    );
    return {
      success: true,
      data: { questionIds },
      message: `推荐了${questionIds.length}道题目`,
    };
  }

  @Post('extract-resume-keywords')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '从简历中提取关键词' })
  @ApiResponse({ status: 200, description: '提取成功' })
  async extractResumeKeywords(@Body('text') text: string) {
    const keywords = await this.aiService.extractKeywordsFromResume(text);
    return {
      success: true,
      data: { keywords },
      message: '关键词提取成功',
    };
  }

  @Post('extract-job-keywords')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '从岗位描述中提取关键词' })
  @ApiResponse({ status: 200, description: '提取成功' })
  async extractJobKeywords(
    @Body('jobTitle') jobTitle: string,
    @Body('requirements') requirements: string,
  ) {
    const keywords = await this.aiService.extractKeywordsFromJob(
      jobTitle,
      requirements,
    );
    return {
      success: true,
      data: { keywords },
      message: '关键词提取成功',
    };
  }

  @Post('calculate-match')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'AI计算岗位匹配度' })
  @ApiResponse({ status: 200, description: '计算成功' })
  async calculateMatch(
    @Body('resumeText') resumeText: string,
    @Body('jobTitle') jobTitle: string,
    @Body('jobRequirements') jobRequirements: string,
  ) {
    const result = await this.aiService.calculateMatchScore(
      resumeText,
      jobTitle,
      jobRequirements,
    );
    return {
      success: true,
      data: result,
      message: '匹配度计算成功',
    };
  }
}

