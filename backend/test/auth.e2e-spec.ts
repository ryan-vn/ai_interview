import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, TEST_USERS } from './test-helper';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register - 用户注册', () => {
    // TC-AUTH-001: 成功注册候选人账户
    it('应该成功注册候选人账户', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'new_candidate_' + Date.now(),
          email: `candidate_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username');
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    // TC-AUTH-002: 成功注册面试官账户
    it('应该成功注册面试官账户', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'new_interviewer_' + Date.now(),
          email: `interviewer_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 2,
        })
        .expect(201);
    });

    // TC-AUTH-003: 成功注册管理员账户
    it('应该成功注册管理员账户', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'new_admin_' + Date.now(),
          email: `admin_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 1,
        })
        .expect(201);
    });

    // TC-AUTH-004: 用户名已存在
    it('用户名已存在时应该返回错误', async () => {
      const username = 'duplicate_user_' + Date.now();
      const email1 = `email1_${Date.now()}@test.com`;
      const email2 = `email2_${Date.now()}@test.com`;

      // 第一次注册成功
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email: email1,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(201);

      // 第二次注册应该失败（用户名重复）
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email: email2,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect((res) => {
          expect([400, 409]).toContain(res.status);
          expect(res.body).toHaveProperty('message');
        });
    });

    // TC-AUTH-005: 邮箱已存在
    it('邮箱已存在时应该返回错误', async () => {
      const username1 = 'user1_' + Date.now();
      const username2 = 'user2_' + Date.now();
      const email = `duplicate_${Date.now()}@test.com`;

      // 第一次注册成功
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: username1,
          email,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(201);

      // 第二次注册应该失败（邮箱重复）
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: username2,
          email,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect((res) => {
          expect([400, 409]).toContain(res.status);
        });
    });

    // TC-AUTH-006: 无效的邮箱格式
    it('无效的邮箱格式应该返回错误', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'test_user',
          email: 'invalid-email',
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    // TC-AUTH-007: 密码过短
    it('密码过短应该返回错误', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'test_user_' + Date.now(),
          email: `test_${Date.now()}@test.com`,
          password: '123',
          roleId: 3,
        })
        .expect(400);
    });

    // TC-AUTH-008: 缺少必填字段
    it('缺少必填字段应该返回错误', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'test_user',
        })
        .expect(400);
    });

    // TC-AUTH-009: 无效的角色ID
    it('无效的角色ID应该返回错误', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'test_user_' + Date.now(),
          email: `test_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 999,
        })
        .expect(400);
    });
  });

  describe('POST /auth/login - 用户登录', () => {
    let testUser: any;

    beforeAll(async () => {
      // 创建测试用户
      const username = 'login_test_' + Date.now();
      const email = `login_test_${Date.now()}@test.com`;
      const password = 'Test123456!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
          roleId: 3,
        })
        .expect(201);

      testUser = { username, email, password };
    });

    // TC-AUTH-010: 使用用户名成功登录
    it('应该使用用户名成功登录', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('username', testUser.username);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    // TC-AUTH-011: 使用邮箱成功登录
    it('应该使用邮箱成功登录', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(res.body.access_token.length).toBeGreaterThan(0);
        });
    });

    // TC-AUTH-012: 错误的密码
    it('错误的密码应该返回401错误', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    // TC-AUTH-013: 不存在的用户
    it('不存在的用户应该返回401错误', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent_user_' + Date.now(),
          password: 'Test123456!',
        })
        .expect(401);
    });

    // TC-AUTH-014: 空用户名和密码
    it('空用户名和密码应该返回400错误', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: '',
          password: '',
        })
        .expect(400);
    });

    // TC-AUTH-015: 缺少登录凭证
    it('缺少登录凭证应该返回400错误', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /auth/profile - 获取当前用户信息', () => {
    let validToken: string;
    let userId: number;

    beforeAll(async () => {
      // 注册并登录获取token
      const username = 'profile_test_' + Date.now();
      const email = `profile_${Date.now()}@test.com`;
      const password = 'Test123456!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username,
          email,
          password,
          roleId: 3,
        });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password });

      validToken = loginRes.body.access_token;
      userId = loginRes.body.user.id;
    });

    // TC-AUTH-016: 使用有效token获取用户信息
    it('应该使用有效token获取用户信息', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('username');
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    // TC-AUTH-017: 未提供token
    it('未提供token应该返回401错误', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    // TC-AUTH-018: 使用过期token (模拟)
    // 注意：实际测试需要等待token过期或使用mock
    it.skip('使用过期token应该返回401错误', () => {
      const expiredToken = 'expired.token.here';
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    // TC-AUTH-019: 使用无效token格式
    it('使用无效token格式应该返回401错误', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token_format')
        .expect(401);
    });

    // TC-AUTH-020: 使用被篡改的token
    it('使用被篡改的token应该返回401错误', () => {
      const tamperedToken = validToken.slice(0, -10) + 'tampered123';
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });
});

