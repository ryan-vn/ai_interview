import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeAuditLog, ResumeActionType } from './entities/resume-audit-log.entity';

@Injectable()
export class ResumeAuditService {
  constructor(
    @InjectRepository(ResumeAuditLog)
    private auditLogRepository: Repository<ResumeAuditLog>,
  ) {}

  /**
   * 记录简历操作日志
   */
  async log(
    resumeId: number,
    action: ResumeActionType,
    userId: number,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ResumeAuditLog> {
    const log = this.auditLogRepository.create({
      resumeId,
      action,
      userId,
      details,
      ipAddress,
      userAgent,
    });

    return await this.auditLogRepository.save(log);
  }

  /**
   * 获取简历的操作历史
   */
  async getResumeHistory(
    resumeId: number,
    limit: number = 50,
  ): Promise<ResumeAuditLog[]> {
    return await this.auditLogRepository.find({
      where: { resumeId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取用户的操作历史
   */
  async getUserHistory(
    userId: number,
    limit: number = 50,
  ): Promise<ResumeAuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      relations: ['resume', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取操作统计
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (startDate) {
      queryBuilder.andWhere('log.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('log.created_at <= :endDate', { endDate });
    }

    const actionCounts = await queryBuilder
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .getRawMany();

    const total = await queryBuilder.getCount();

    return {
      total,
      actionCounts,
    };
  }
}

