import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession, InterviewStatus } from './entities/interview-session.entity';
import { Template } from './entities/template.entity';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

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
    const session = this.sessionsRepository.create({
      ...createDto,
      candidateId: userId,
    });

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

