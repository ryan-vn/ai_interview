import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

/**
 * 测试应用初始化
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

/**
 * 测试用户数据
 */
export const TEST_USERS = {
  admin: {
    username: 'test_admin',
    email: 'admin@test.com',
    password: 'Admin123456!',
    roleId: 1,
  },
  interviewer: {
    username: 'test_interviewer',
    email: 'interviewer@test.com',
    password: 'Inter123456!',
    roleId: 2,
  },
  candidate: {
    username: 'test_candidate',
    email: 'candidate@test.com',
    password: 'Candi123456!',
    roleId: 3,
  },
  candidate2: {
    username: 'test_candidate2',
    email: 'candidate2@test.com',
    password: 'Candi123456!',
    roleId: 3,
  },
};

/**
 * 测试题目数据
 */
export const TEST_QUESTIONS = {
  programming: {
    type: 'programming',
    title: '两数之和',
    description: '给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那两个整数。',
    difficulty: 'easy',
    tags: ['数组', '哈希表'],
    languageOptions: ['python', 'javascript', 'java'],
    testCases: [
      {
        input: '[2,7,11,15], 9',
        output: '[0,1]',
        isHidden: false,
      },
      {
        input: '[3,2,4], 6',
        output: '[1,2]',
        isHidden: false,
      },
    ],
    starterCode: {
      python: 'def twoSum(nums, target):\n    pass',
      javascript: 'function twoSum(nums, target) {\n    \n}',
    },
    timeLimit: 1000,
    memoryLimit: 256,
  },
  qa: {
    type: 'qa',
    title: '介绍你最有挑战的项目',
    description: '请详细描述项目背景、你的角色、遇到的挑战和解决方案',
    difficulty: 'medium',
    tags: ['项目经验', '问题解决'],
    referenceAnswer: '应包括：项目背景、技术栈、个人贡献、问题与解决方案...',
    scoringCriteria: {
      clarity: 25,
      depth: 25,
      technical: 25,
      communication: 25,
    },
  },
};

/**
 * 注册测试用户并返回token
 */
export async function registerAndLogin(
  app: INestApplication,
  userData: any,
): Promise<{ token: string; userId: number }> {
  // 注册
  await request(app.getHttpServer()).post('/auth/register').send(userData);

  // 登录
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      username: userData.username,
      password: userData.password,
    });

  return {
    token: loginResponse.body.access_token,
    userId: loginResponse.body.user.id,
  };
}

/**
 * 创建测试题目
 */
export async function createTestQuestion(
  app: INestApplication,
  token: string,
  questionData: any,
): Promise<number> {
  const response = await request(app.getHttpServer())
    .post('/questions')
    .set('Authorization', `Bearer ${token}`)
    .send(questionData)
    .expect(201);

  return response.body.id;
}

/**
 * 创建测试模板
 */
export async function createTestTemplate(
  app: INestApplication,
  token: string,
  templateData: any,
): Promise<number> {
  const response = await request(app.getHttpServer())
    .post('/interviews/templates')
    .set('Authorization', `Bearer ${token}`)
    .send(templateData)
    .expect(201);

  return response.body.id;
}

/**
 * 创建测试面试场次
 */
export async function createTestSession(
  app: INestApplication,
  token: string,
  sessionData: any,
): Promise<number> {
  const response = await request(app.getHttpServer())
    .post('/interviews/sessions')
    .set('Authorization', `Bearer ${token}`)
    .send(sessionData)
    .expect(201);

  return response.body.id;
}

/**
 * 清理测试数据（可选，根据实际数据库配置）
 */
export async function cleanupTestData(app: INestApplication) {
  // 这里可以添加清理测试数据的逻辑
  // 例如删除测试用户、题目、面试场次等
}

