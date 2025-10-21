import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateScoreDto } from './dto/update-score.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate/:sessionId')
  @Roles('interviewer', 'admin')
  @ApiOperation({ summary: '生成面试报告' })
  generateReport(@Param('sessionId') sessionId: string) {
    return this.reportsService.generateReport(+sessionId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: '获取面试报告' })
  findBySession(@Param('sessionId') sessionId: string) {
    return this.reportsService.findBySession(+sessionId);
  }

  @Patch('score/:submissionId')
  @Roles('interviewer', 'admin')
  @ApiOperation({ summary: '更新人工评分' })
  updateScore(
    @Param('submissionId') submissionId: string,
    @Body() updateScoreDto: UpdateScoreDto,
    @Request() req,
  ) {
    return this.reportsService.updateScoreRecord(
      +submissionId,
      updateScoreDto.score,
      updateScoreDto.feedback,
      req.user.userId,
    );
  }
}

