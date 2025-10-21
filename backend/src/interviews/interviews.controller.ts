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

@ApiTags('interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  // 面试场次
  @Post('sessions')
  @ApiOperation({ summary: '创建面试场次' })
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

  // 邀请链接相关
  @Get('invite/:token')
  @ApiOperation({ summary: '通过邀请链接获取面试信息' })
  getSessionByInvite(@Param('token') token: string) {
    return this.interviewsService.getSessionByInviteToken(token);
  }

  @Post('invite/:token/join')
  @ApiOperation({ summary: '候选人通过邀请链接加入面试' })
  joinSessionByInvite(
    @Param('token') token: string,
    @Request() req,
  ) {
    return this.interviewsService.joinSessionByInvite(token, req.user.userId);
  }
}

