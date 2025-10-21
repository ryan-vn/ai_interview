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

@ApiTags('submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: '提交答案' })
  create(@Body() createDto: CreateSubmissionDto, @Request() req) {
    return this.submissionsService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取提交列表' })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query('sessionId') sessionId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.submissionsService.findAll(
      sessionId ? +sessionId : undefined,
      userId ? +userId : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取提交详情' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(+id);
  }
}

