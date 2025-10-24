import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditModule } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  module: AuditModule;
  action: AuditAction;
  targetId?: number;
  targetName?: string;
  details?: any;
  oldData?: any;
  newData?: any;
  userId: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 创建审计日志
   */
  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogRepository.create(dto);
    return await this.auditLogRepository.save(log);
  }

  /**
   * 获取审计日志列表
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    module?: AuditModule,
    action?: AuditAction,
    userId?: number,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (module) {
      queryBuilder.andWhere('log.module = :module', { module });
    }

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 记录题目创建日志
   */
  async logQuestionCreate(
    questionId: number,
    questionTitle: string,
    data: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.QUESTION,
      action: AuditAction.CREATE,
      targetId: questionId,
      targetName: questionTitle,
      newData: data,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录题目更新日志
   */
  async logQuestionUpdate(
    questionId: number,
    questionTitle: string,
    oldData: any,
    newData: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.QUESTION,
      action: AuditAction.UPDATE,
      targetId: questionId,
      targetName: questionTitle,
      oldData,
      newData,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录题目删除日志
   */
  async logQuestionDelete(
    questionId: number,
    questionTitle: string,
    data: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.QUESTION,
      action: AuditAction.DELETE,
      targetId: questionId,
      targetName: questionTitle,
      oldData: data,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录批量导入日志
   */
  async logQuestionImport(
    importResult: { successCount: number; failedCount: number },
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.QUESTION,
      action: AuditAction.IMPORT,
      details: importResult,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录标签创建日志
   */
  async logTagCreate(
    tagId: number,
    tagName: string,
    data: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.TAG,
      action: AuditAction.CREATE,
      targetId: tagId,
      targetName: tagName,
      newData: data,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录标签更新日志
   */
  async logTagUpdate(
    tagId: number,
    tagName: string,
    oldData: any,
    newData: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.TAG,
      action: AuditAction.UPDATE,
      targetId: tagId,
      targetName: tagName,
      oldData,
      newData,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录标签删除日志
   */
  async logTagDelete(
    tagId: number,
    tagName: string,
    data: any,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      module: AuditModule.TAG,
      action: AuditAction.DELETE,
      targetId: tagId,
      targetName: tagName,
      oldData: data,
      userId,
      ipAddress,
      userAgent,
    });
  }
}

