import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局响应拦截器 - 统一返回格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器 - 统一错误格式
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局前缀
  app.setGlobalPrefix('api');

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('AI Interview System API')
    .setDescription(
      `
      ## AI 面试系统后端 API 文档

      ### 功能模块
      - **认证模块**: 用户注册、登录、获取用户信息
      - **用户管理**: 用户 CRUD 操作、角色管理
      - **题库管理**: 面试题目的创建、查询、更新、删除
      - **面试管理**: 面试场次和模板管理
      - **提交记录**: 候选人答题提交
      - **面试报告**: AI 评分和报告生成

      ### 认证说明
      大部分接口需要 JWT 认证，请在请求头中添加：
      \`\`\`
      Authorization: Bearer <your_token>
      \`\`\`

      ### 角色权限
      - **候选人 (candidate)**: 查看题目、提交答案、查看自己的报告
      - **面试官 (interviewer)**: 创建题目和模板、管理面试、评分
      - **管理员 (admin)**: 完整的系统管理权限
      `,
    )
    .setVersion('1.0.0')
    .setContact(
      'AI Interview System',
      'https://github.com/yourcompany/interview-system',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', '认证相关 - 用户注册、登录、获取个人信息')
    .addTag('users', '用户管理 - 用户 CRUD 操作、角色管理')
    .addTag('questions', '题库管理 - 面试题目的增删改查')
    .addTag('interviews', '面试管理 - 面试场次和模板管理')
    .addTag('submissions', '提交记录 - 候选人答题提交和查询')
    .addTag('reports', '面试报告 - AI 评分和报告生成')
    .addServer('http://localhost:3001', '本地开发环境')
    .addServer('https://api.example.com', '生产环境')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: 'AI Interview System API Docs',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs\n`);
}

bootstrap();

