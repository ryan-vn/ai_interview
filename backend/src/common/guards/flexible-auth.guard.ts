import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';

/**
 * 灵活认证守卫
 * 支持 JWT Token 或 Invite Token 认证
 */
@Injectable()
export class FlexibleAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @InjectRepository(InterviewSession)
    private sessionsRepository: Repository<InterviewSession>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const inviteToken = request.headers['x-invite-token'];

    // 如果有邀请令牌，使用邀请令牌验证
    if (inviteToken) {
      try {
        const session = await this.sessionsRepository.findOne({
          where: { inviteToken },
        });

        if (!session) {
          throw new UnauthorizedException('邀请令牌无效');
        }

        if (new Date() > session.inviteExpiresAt) {
          throw new UnauthorizedException('邀请链接已过期');
        }

        // 设置访客用户信息
        request.inviteSession = session;
        request.user = {
          userId: session.candidateId || 0,
          role: 'guest',
          sessionId: session.id,
        };

        return true;
      } catch (error) {
        // 邀请令牌验证失败，尝试 JWT
      }
    }

    // 尝试 JWT 认证
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      throw new UnauthorizedException('认证失败，请登录或使用有效的邀请链接');
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // 如果是邀请令牌认证，直接返回已设置的 user
    if (request.user && request.user.role === 'guest') {
      return request.user;
    }

    // JWT 认证
    if (err || !user) {
      throw err || new UnauthorizedException('认证失败');
    }
    return user;
  }
}

