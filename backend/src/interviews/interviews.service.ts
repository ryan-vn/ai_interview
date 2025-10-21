import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession, InterviewStatus } from './entities/interview-session.entity';
import { Template } from './entities/template.entity';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(InterviewSession)
    private sessionsRepository: Repository<InterviewSession>,
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
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
      position: createDto.candidateInfo.position,
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
    // TODO: 实现邮件发送逻辑
    // 这里可以集成邮件服务，如 SendGrid, AWS SES 等
    console.log(`发送面试邀请邮件给: ${session.candidateEmail}`);
    console.log(`面试链接: https://interview.example.com/invite/${session.inviteToken}`);
    console.log(`面试时间: ${session.scheduledAt}`);
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
      .leftJoinAndSelect('session.interviewer', 'interviewer');

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
}

