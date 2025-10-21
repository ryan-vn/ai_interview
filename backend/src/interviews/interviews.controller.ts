import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  // 面试场次
  @Post('sessions')
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '创建面试场次', description: 'HR和面试官可以创建面试场次，HR可以创建邀请链接' })
  createSession(
    @Body() createDto: CreateInterviewSessionDto,
    @Request() req,
  ) {
    return this.interviewsService.createSession(createDto, req.user.userId);
  }

  @Get('sessions')
  @ApiOperation({ summary: '获取面试场次列表' })
  findAllSessions(@Request() req) {
    // 根据角色返回不同的数据
    return this.interviewsService.findAllSessions(
      req.user.userId,
      req.user.role,
    );
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '获取面试场次详情' })
  findOneSession(@Param('id') id: string) {
    return this.interviewsService.findOneSession(+id);
  }

  @Patch('sessions/:id/start')
  @ApiOperation({ summary: '开始面试' })
  startSession(@Param('id') id: string) {
    return this.interviewsService.startSession(+id);
  }

  @Patch('sessions/:id/complete')
  @ApiOperation({ summary: '完成面试' })
  completeSession(@Param('id') id: string) {
    return this.interviewsService.completeSession(+id);
  }

  // 模板管理
  @Post('templates')
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '创建面试模板' })
  createTemplate(@Body() createDto: CreateTemplateDto, @Request() req) {
    return this.interviewsService.createTemplate(createDto, req.user.userId);
  }

  @Get('templates')
  @ApiOperation({ summary: '获取所有面试模板' })
  findAllTemplates() {
    return this.interviewsService.findAllTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '获取模板详情' })
  findOneTemplate(@Param('id') id: string) {
    return this.interviewsService.findOneTemplate(+id);
  }

  @Delete('templates/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除模板' })
  removeTemplate(@Param('id') id: string) {
    return this.interviewsService.removeTemplate(+id);
  }

  // 邀请链接相关 - 这些端点不需要认证，因为候选人是通过邀请链接访问的
  @Get('invite/:token')
  @ApiOperation({ summary: '通过邀请链接获取面试信息' })
  @Public()
  getSessionByInvite(@Param('token') token: string) {
    return this.interviewsService.getSessionByInviteToken(token);
  }

  @Post('invite/:token/join')
  @ApiOperation({ summary: '候选人通过邀请链接加入面试' })
  @Public()
  joinSessionByInvite(
    @Param('token') token: string,
    @Body() joinDto: any,
  ) {
    return this.interviewsService.joinSessionByInvite(token, joinDto);
  }

  @Post('sessions/:id/resend-invite')
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '重新发送面试邀请邮件' })
  resendInvite(@Param('id') id: string) {
    return this.interviewsService.resendInvite(+id);
  }

  // HR专用功能
  @Get('hr/statistics')
  @Roles('admin')
  @ApiOperation({ summary: '获取HR统计数据', description: '获取面试统计信息，仅HR可访问' })
  getHrStatistics(@Request() req) {
    return this.interviewsService.getHrStatistics();
  }

  @Get('hr/sessions')
  @Roles('admin')
  @ApiOperation({ summary: '获取所有面试场次', description: 'HR可以查看所有面试场次，包括候选人信息' })
  getAllSessionsForHr(@Request() req) {
    return this.interviewsService.findAllSessionsForHr();
  }

  @Post('hr/sessions/batch')
  @Roles('admin')
  @ApiOperation({ summary: '批量创建面试场次', description: 'HR可以批量创建多个面试场次' })
  createBatchSessions(
    @Body() batchData: { sessions: CreateInterviewSessionDto[] },
    @Request() req,
  ) {
    return this.interviewsService.createBatchSessions(batchData.sessions, req.user.userId);
  }

  @Get('hr/candidates')
  @Roles('admin')
  @ApiOperation({ summary: '获取候选人列表', description: '获取所有候选人信息' })
  getCandidates(@Request() req) {
    return this.interviewsService.getCandidates();
  }

  @Patch('sessions/:id/cancel')
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '取消面试场次' })
  cancelSession(@Param('id') id: string, @Request() req) {
    return this.interviewsService.cancelSession(+id, req.user.userId);
  }
}

