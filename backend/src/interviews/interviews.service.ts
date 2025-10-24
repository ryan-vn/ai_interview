import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession, InterviewStatus } from './entities/interview-session.entity';
import { Template } from './entities/template.entity';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { EmailService } from '../common/services/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(InterviewSession)
    private sessionsRepository: Repository<InterviewSession>,
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    private emailService: EmailService,
  ) {}

  // 面试场次相关
  async createSession(
    createDto: CreateInterviewSessionDto,
    userId: number,
  ): Promise<InterviewSession> {
    // 生成唯一的邀请令牌
    const inviteToken = randomBytes(32).toString('hex');
    
    // 设置邀请链接过期时间（默认7天）
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

    const session = this.sessionsRepository.create({
      name: createDto.name,
      templateId: createDto.templateId,
      interviewerId: createDto.interviewerId,
      scheduledAt: createDto.scheduledAt,
      candidateName: createDto.candidateInfo.name,
      candidateEmail: createDto.candidateInfo.email,
      candidatePhone: createDto.candidateInfo.phone,
      position: createDto.candidateInfo.position || createDto.candidateInfo.jobId ? undefined : undefined,
      jobId: createDto.jobId || createDto.candidateInfo.jobId,
      resumeId: createDto.resumeId || createDto.candidateInfo.resumeId,
      inviteToken,
      inviteExpiresAt,
      // 候选人ID暂时为空，等候选人通过邀请链接注册后关联
      candidateId: null,
    });

    const savedSession = await this.sessionsRepository.save(session);
    
    // TODO: 发送邮件通知候选人
    await this.sendInterviewInvitation(savedSession);
    
    return savedSession;
  }

  // 发送面试邀请邮件
  private async sendInterviewInvitation(session: InterviewSession): Promise<void> {
    try {
      await this.emailService.sendInterviewInvitation(session);
    } catch (error) {
      // 邮件发送失败不应该影响面试创建
      console.error('发送面试邀请邮件失败:', error);
    }
  }

  // 通过邀请令牌获取面试场次
  async getSessionByInviteToken(inviteToken: string): Promise<InterviewSession> {
    const session = await this.sessionsRepository.findOne({
      where: { inviteToken },
      relations: ['template', 'interviewer'],
    });

    if (!session) {
      throw new NotFoundException('面试邀请链接无效或已过期');
    }

    if (new Date() > session.inviteExpiresAt) {
      throw new NotFoundException('面试邀请链接已过期');
    }

    return session;
  }

  // 候选人通过邀请链接加入面试
  async joinSessionByInvite(inviteToken: string, candidateId: number): Promise<InterviewSession> {
    const session = await this.getSessionByInviteToken(inviteToken);
    
    session.candidateId = candidateId;
    return this.sessionsRepository.save(session);
  }

  async findAllSessions(userId?: number, role?: string): Promise<InterviewSession[]> {
    const queryBuilder = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.template', 'template')
      .leftJoinAndSelect('session.candidate', 'candidate')
      .leftJoinAndSelect('session.interviewer', 'interviewer')
      .leftJoinAndSelect('session.job', 'job')
      .leftJoinAndSelect('session.resume', 'resume');

    if (role === 'candidate' && userId) {
      queryBuilder.where('session.candidateId = :userId', { userId });
    } else if (role === 'interviewer' && userId) {
      queryBuilder.where('session.interviewerId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async findOneSession(id: number): Promise<InterviewSession> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['template', 'candidate', 'interviewer', 'submissions'],
    });

    if (!session) {
      throw new NotFoundException(`Interview session with ID ${id} not found`);
    }

    return session;
  }

  async startSession(id: number): Promise<InterviewSession> {
    const session = await this.findOneSession(id);
    session.status = InterviewStatus.IN_PROGRESS;
    session.actualStartAt = new Date();
    return this.sessionsRepository.save(session);
  }

  async completeSession(id: number): Promise<InterviewSession> {
    const session = await this.findOneSession(id);
    session.status = InterviewStatus.COMPLETED;
    session.actualEndAt = new Date();
    return this.sessionsRepository.save(session);
  }

  // 模板相关
  async createTemplate(
    createDto: CreateTemplateDto,
    userId: number,
  ): Promise<Template> {
    const template = this.templatesRepository.create({
      ...createDto,
      createdBy: userId,
    });

    return this.templatesRepository.save(template);
  }

  async findAllTemplates(): Promise<Template[]> {
    return this.templatesRepository.find({
      relations: ['creator'],
    });
  }

  async findOneTemplate(id: number): Promise<Template> {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async removeTemplate(id: number): Promise<void> {
    const template = await this.findOneTemplate(id);
    await this.templatesRepository.remove(template);
  }

  // 重新发送邀请邮件
  async resendInvite(id: number): Promise<{ message: string }> {
    const session = await this.findOneSession(id);
    
    // 检查邀请是否过期
    if (new Date() > session.inviteExpiresAt) {
      // 生成新的邀请令牌和过期时间
      session.inviteToken = randomBytes(32).toString('hex');
      session.inviteExpiresAt = new Date();
      session.inviteExpiresAt.setDate(session.inviteExpiresAt.getDate() + 7);
      await this.sessionsRepository.save(session);
    }
    
    // 重新发送邀请邮件
    await this.sendInterviewInvitation(session);
    
    return { message: '邀请邮件已重新发送' };
  }

  // HR专用功能
  async getHrStatistics(): Promise<any> {
    const totalSessions = await this.sessionsRepository.count();
    const scheduledSessions = await this.sessionsRepository.count({
      where: { status: InterviewStatus.SCHEDULED }
    });
    const inProgressSessions = await this.sessionsRepository.count({
      where: { status: InterviewStatus.IN_PROGRESS }
    });
    const completedSessions = await this.sessionsRepository.count({
      where: { status: InterviewStatus.COMPLETED }
    });
    const cancelledSessions = await this.sessionsRepository.count({
      where: { status: InterviewStatus.CANCELLED }
    });

    // 获取最近7天的面试统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSessions = await this.sessionsRepository.count({
      where: {
        createdAt: {
          $gte: sevenDaysAgo
        } as any
      }
    });

    return {
      totalSessions,
      scheduledSessions,
      inProgressSessions,
      completedSessions,
      cancelledSessions,
      recentSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    };
  }

  async findAllSessionsForHr(): Promise<InterviewSession[]> {
    return this.sessionsRepository.find({
      relations: ['template', 'candidate', 'interviewer'],
      order: { createdAt: 'DESC' }
    });
  }

  async createBatchSessions(sessions: CreateInterviewSessionDto[], userId: number): Promise<{ created: number; failed: number; results: any[] }> {
    const results = [];
    let created = 0;
    let failed = 0;

    for (const sessionData of sessions) {
      try {
        const session = await this.createSession(sessionData, userId);
        results.push({ success: true, session });
        created++;
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          sessionData: {
            name: sessionData.name,
            candidateEmail: sessionData.candidateInfo.email
          }
        });
        failed++;
      }
    }

    return { created, failed, results };
  }

  async getCandidates(): Promise<any[]> {
    const sessions = await this.sessionsRepository.find({
      select: ['candidateName', 'candidateEmail', 'candidatePhone', 'position', 'createdAt'],
      order: { createdAt: 'DESC' }
    });

    // 去重并统计每个候选人的面试次数
    const candidateMap = new Map();
    
    sessions.forEach(session => {
      const key = session.candidateEmail;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          name: session.candidateName,
          email: session.candidateEmail,
          phone: session.candidatePhone,
          position: session.position,
          interviewCount: 0,
          firstInterviewDate: session.createdAt,
          lastInterviewDate: session.createdAt
        });
      }
      
      const candidate = candidateMap.get(key);
      candidate.interviewCount++;
      if (session.createdAt > candidate.lastInterviewDate) {
        candidate.lastInterviewDate = session.createdAt;
      }
    });

    return Array.from(candidateMap.values());
  }

  async cancelSession(id: number, userId: number): Promise<InterviewSession> {
    const session = await this.findOneSession(id);
    session.status = InterviewStatus.CANCELLED;
    return this.sessionsRepository.save(session);
  }
}

