import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { MatchResult } from './entities/match-result.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('匹配度与推荐')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('calculate')
  @Roles('admin', 'hr')
  @ApiOperation({ 
    summary: '计算简历与岗位的匹配度（使用AI智能分析）',
    description: '使用 AI 深度分析简历与岗位的匹配度，提供详细的分析报告，包括匹配优势和待提升项' 
  })
  @ApiQuery({ name: 'resumeId', description: '简历ID', example: 1 })
  @ApiQuery({ name: 'jobId', description: '岗位ID', example: 1 })
  @ApiResponse({ status: 200, description: '计算成功，返回匹配度分数和详细分析', type: MatchResult })
  async calculateMatch(
    @Query('resumeId', ParseIntPipe) resumeId: number,
    @Query('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.matchingService.calculateMatch(resumeId, jobId);
  }

  @Get('recommend-jobs')
  @Roles('admin', 'hr')
  @ApiOperation({ 
    summary: '为简历推荐岗位（基于AI智能匹配）',
    description: '使用 AI 分析简历，推荐最匹配的岗位' 
  })
  @ApiQuery({ name: 'resumeId', description: '简历ID', example: 1 })
  @ApiQuery({
    name: 'limit',
    description: '推荐数量',
    example: 5,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '推荐成功，返回按匹配度排序的岗位列表',
    type: [MatchResult],
  })
  async recommendJobs(
    @Query('resumeId', ParseIntPipe) resumeId: number,
    @Query('limit') limit?: string,
  ) {
    const results = await this.matchingService.recommendJobsForResume(
      resumeId,
      limit ? parseInt(limit) : 5,
    );

    return {
      resumeId,
      recommendations: results.map((r) => ({
        jobId: r.jobId,
        score: r.score,
        matchedKeywords: r.matchedKeywords,
        missingKeywords: r.missingKeywords,
        details: r.details,
      })),
    };
  }

  @Get('recommend-resumes')
  @Roles('admin', 'hr')
  @ApiOperation({ 
    summary: '为岗位推荐候选人（基于AI智能匹配）',
    description: '使用 AI 分析岗位要求，推荐最匹配的候选人' 
  })
  @ApiQuery({ name: 'jobId', description: '岗位ID', example: 1 })
  @ApiQuery({
    name: 'limit',
    description: '推荐数量',
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '推荐成功，返回按匹配度排序的候选人列表',
    type: [MatchResult],
  })
  async recommendResumes(
    @Query('jobId', ParseIntPipe) jobId: number,
    @Query('limit') limit?: string,
  ) {
    const results = await this.matchingService.recommendResumesForJob(
      jobId,
      limit ? parseInt(limit) : 10,
    );

    return {
      jobId,
      recommendations: results.map((r) => ({
        resumeId: r.resumeId,
        score: r.score,
        matchedKeywords: r.matchedKeywords,
        missingKeywords: r.missingKeywords,
        details: r.details,
      })),
    };
  }

  @Get('result')
  @ApiOperation({ summary: '获取匹配结果' })
  @ApiQuery({ name: 'resumeId', description: '简历ID', example: 1 })
  @ApiQuery({ name: 'jobId', description: '岗位ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功', type: MatchResult })
  async getMatchResult(
    @Query('resumeId', ParseIntPipe) resumeId: number,
    @Query('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.matchingService.getMatchResult(resumeId, jobId);
  }

  @Post('batch-calculate')
  @Roles('admin', 'hr')
  @ApiOperation({ 
    summary: '批量计算匹配度（使用AI智能分析）',
    description: '批量计算多个简历与多个岗位的匹配度，使用 AI 进行智能分析。注意：大量计算可能需要较长时间' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '计算完成，返回总数和完成数',
    schema: {
      properties: {
        total: { type: 'number', description: '总计算数量' },
        completed: { type: 'number', description: '已完成数量' },
      },
    },
  })
  async batchCalculate(
    @Body('resumeIds') resumeIds?: number[],
    @Body('jobIds') jobIds?: number[],
  ) {
    return this.matchingService.batchCalculateMatches(resumeIds, jobIds);
  }
}

