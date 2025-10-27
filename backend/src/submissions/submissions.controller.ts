import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Public() // 允许访客提交答案
  @ApiOperation({ summary: '提交答案（支持访客访问）' })
  create(@Body() createDto: CreateSubmissionDto, @Request() req) {
    // 如果是访客，userId 为 null，后续可以通过 sessionId 关联
    const userId = req.user?.userId || null;
    return this.submissionsService.create(createDto, userId);
  }

  @Get()
  @Public() // 允许访客查询自己的提交
  @ApiOperation({ summary: '获取提交列表（支持访客访问）' })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'questionId', required: false })
  findAll(
    @Query('sessionId') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('questionId') questionId?: string,
  ) {
    return this.submissionsService.findAll(
      sessionId ? +sessionId : undefined,
      userId ? +userId : undefined,
      questionId ? +questionId : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取提交详情' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(+id);
  }
}

