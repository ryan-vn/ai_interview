import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';

/**
 * 邀请令牌守卫
 * 允许使用邀请令牌访问特定的面试相关接口
 */
@Injectable()
export class InviteTokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(InterviewSession)
    private sessionsRepository: Repository<InterviewSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const inviteToken = request.headers['x-invite-token'];

    // 如果没有邀请令牌，返回 false（让其他 guard 处理）
    if (!inviteToken) {
      return false;
    }

    try {
      // 验证邀请令牌
      const session = await this.sessionsRepository.findOne({
        where: { inviteToken },
      });

      if (!session) {
        throw new UnauthorizedException('邀请令牌无效');
      }

      // 检查是否过期
      if (new Date() > session.inviteExpiresAt) {
        throw new UnauthorizedException('邀请链接已过期');
      }

      // 将会话信息附加到请求对象
      request.inviteSession = session;
      request.user = {
        userId: session.candidateId || 0, // 访客模式
        role: 'guest',
        sessionId: session.id,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('邀请令牌验证失败');
    }
  }
}

