import { Injectable, Logger } from '@nestjs/common';
import { InterviewSession } from '../../interviews/entities/interview-session.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendInterviewInvitation(session: InterviewSession): Promise<void> {
    try {
      // 生成邀请链接
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${session.inviteToken}`;
      
      // 邮件内容
      const emailContent = this.generateInvitationEmail(session, inviteLink);
      
      // 这里可以集成真实的邮件服务，如 SendGrid, AWS SES, Nodemailer 等
      // 目前只是记录日志
      this.logger.log(`发送面试邀请邮件给: ${session.candidateEmail}`);
      this.logger.log(`邀请链接: ${inviteLink}`);
      this.logger.log(`邮件内容:\n${emailContent}`);
      
      // TODO: 集成真实的邮件服务
      // await this.sendEmail({
      //   to: session.candidateEmail,
      //   subject: `面试邀请 - ${session.name}`,
      //   html: emailContent,
      // });
      
    } catch (error) {
      this.logger.error(`发送邮件失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateInvitationEmail(session: InterviewSession, inviteLink: string): string {
    const scheduledDate = new Date(session.scheduledAt).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });

    const expireDate = new Date(session.inviteExpiresAt).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>面试邀请</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .interview-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
        }
        .highlight {
            color: #667eea;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 面试邀请</h1>
        <p>您收到了一个面试邀请</p>
    </div>
    
    <div class="content">
        <h2>亲爱的 ${session.candidateName}，</h2>
        
        <p>恭喜您！我们很高兴邀请您参加我们的面试。以下是详细信息：</p>
        
        <div class="interview-info">
            <h3>📋 面试信息</h3>
            <p><strong>面试名称：</strong>${session.name}</p>
            <p><strong>面试时间：</strong><span class="highlight">${scheduledDate}</span></p>
            <p><strong>预计时长：</strong>60 分钟</p>
            ${session.position ? `<p><strong>应聘职位：</strong>${session.position}</p>` : ''}
            ${session.interviewer ? `<p><strong>面试官：</strong>${session.interviewer.username}</p>` : ''}
        </div>
        
        <div style="text-align: center;">
            <a href="${inviteLink}" class="button">🚀 点击加入面试</a>
        </div>
        
        <div class="interview-info">
            <h3>📝 面试说明</h3>
            <p>• 请提前 10 分钟进入面试</p>
            <p>• 确保网络环境稳定</p>
            <p>• 准备好相关证件和简历</p>
            <p>• 面试过程中请保持专注</p>
        </div>
        
        <div class="interview-info">
            <h3>⚠️ 重要提醒</h3>
            <p>• 邀请链接有效期至：<span class="highlight">${expireDate}</span></p>
            <p>• 请确保您已登录系统，如果没有账号，请先注册</p>
            <p>• 如有任何问题，请联系我们的HR团队</p>
        </div>
        
        <p>我们期待与您的会面，祝您面试顺利！</p>
        
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>如有疑问，请联系HR团队</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // 发送提醒邮件
  async sendInterviewReminder(session: InterviewSession): Promise<void> {
    try {
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${session.inviteToken}`;
      const scheduledDate = new Date(session.scheduledAt).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long'
      });

      const reminderContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>面试提醒</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f39c12; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f39c12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ 面试提醒</h1>
    </div>
    <div class="content">
        <h2>亲爱的 ${session.candidateName}，</h2>
        <p>这是一个友好的提醒，您的面试即将开始：</p>
        <p><strong>面试时间：</strong>${scheduledDate}</p>
        <p><strong>面试名称：</strong>${session.name}</p>
        <div style="text-align: center;">
            <a href="${inviteLink}" class="button">立即加入面试</a>
        </div>
        <p>请提前准备，祝您面试顺利！</p>
    </div>
</body>
</html>
      `;

      this.logger.log(`发送面试提醒邮件给: ${session.candidateEmail}`);
      this.logger.log(`提醒内容:\n${reminderContent}`);
      
    } catch (error) {
      this.logger.error(`发送提醒邮件失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
