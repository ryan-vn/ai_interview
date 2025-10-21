import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin } from './test-helper';

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminUserId: number;
  let interviewerToken: string;
  let interviewerUserId: number;
  let candidateToken: string;
  let candidateUserId: number;

  beforeAll(async () => {
    app = await createTestApp();

    // 创建测试用户
    const adminData = await registerAndLogin(app, {
      username: 'admin_users_' + Date.now(),
      email: `admin_users_${Date.now()}@test.com`,
      password: 'Admin123456!',
      roleId: 1,
    });
    adminToken = adminData.token;
    adminUserId = adminData.userId;

    const interviewerData = await registerAndLogin(app, {
      username: 'interviewer_users_' + Date.now(),
      email: `interviewer_users_${Date.now()}@test.com`,
      password: 'Inter123456!',
      roleId: 2,
    });
    interviewerToken = interviewerData.token;
    interviewerUserId = interviewerData.userId;

    const candidateData = await registerAndLogin(app, {
      username: 'candidate_users_' + Date.now(),
      email: `candidate_users_${Date.now()}@test.com`,
      password: 'Candi123456!',
      roleId: 3,
    });
    candidateToken = candidateData.token;
    candidateUserId = candidateData.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users - 创建用户（仅管理员）', () => {
    // TC-USER-001: 管理员成功创建候选人用户
    it('管理员应该能成功创建候选人用户', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'new_candidate_' + Date.now(),
          email: `new_candidate_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    // TC-USER-002: 管理员创建面试官用户
    it('管理员应该能创建面试官用户', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'new_interviewer_' + Date.now(),
          email: `new_interviewer_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 2,
        })
        .expect(201);
    });

    // TC-USER-003: 面试官尝试创建用户（权限不足）
    it('面试官尝试创建用户应该返回403', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          username: 'new_user_' + Date.now(),
          email: `new_user_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(403);
    });

    // TC-USER-004: 候选人尝试创建用户（权限不足）
    it('候选人尝试创建用户应该返回403', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          username: 'new_user_' + Date.now(),
          email: `new_user_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(403);
    });

    // TC-USER-005: 未登录尝试创建用户
    it('未登录尝试创建用户应该返回401', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'new_user_' + Date.now(),
          email: `new_user_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        })
        .expect(401);
    });
  });

  describe('GET /users - 获取所有用户（管理员/面试官）', () => {
    // TC-USER-006: 管理员获取所有用户列表
    it('管理员应该能获取所有用户列表', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('username');
            expect(res.body[0]).not.toHaveProperty('password');
          }
        });
    });

    // TC-USER-007: 面试官获取所有用户列表
    it('面试官应该能获取用户列表', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // TC-USER-008: 候选人尝试获取用户列表（权限不足）
    it('候选人尝试获取用户列表应该返回403', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });
  });

  describe('GET /users/roles - 获取所有角色', () => {
    // TC-USER-010: 获取所有角色列表
    it('登录用户应该能获取所有角色列表', () => {
      return request(app.getHttpServer())
        .get('/users/roles')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
        });
    });

    // TC-USER-011: 未登录获取角色列表
    it('未登录获取角色列表应该返回401', () => {
      return request(app.getHttpServer())
        .get('/users/roles')
        .expect(401);
    });
  });

  describe('GET /users/:id - 获取用户详情', () => {
    // TC-USER-012: 获取存在的用户详情
    it('应该能获取存在的用户详情', () => {
      return request(app.getHttpServer())
        .get(`/users/${candidateUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidateUserId);
          expect(res.body).toHaveProperty('username');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    // TC-USER-013: 获取不存在的用户
    it('获取不存在的用户应该返回404', () => {
      return request(app.getHttpServer())
        .get('/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    // TC-USER-014: 无效的用户ID格式
    it('无效的用户ID格式应该返回400', () => {
      return request(app.getHttpServer())
        .get('/users/invalid_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    // TC-USER-015: 用户查看自己的信息
    it('用户应该能查看自己的信息', () => {
      return request(app.getHttpServer())
        .get(`/users/${candidateUserId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidateUserId);
        });
    });
  });

  describe('PATCH /users/:id - 更新用户信息', () => {
    let testUserId: number;

    beforeAll(async () => {
      // 创建一个测试用户用于更新操作
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'update_test_' + Date.now(),
          email: `update_test_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        });
      testUserId = res.body.id;
    });

    // TC-USER-017: 管理员更新其他用户信息
    it('管理员应该能更新其他用户信息', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `updated_${Date.now()}@test.com`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUserId);
        });
    });

    // TC-USER-020: 更新为重复的邮箱
    it('更新为重复的邮箱应该返回错误', async () => {
      // 先获取候选人的邮箱
      const candidateInfo = await request(app.getHttpServer())
        .get(`/users/${candidateUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 尝试将testUserId的邮箱更新为候选人的邮箱
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: candidateInfo.body.email,
        })
        .expect((res) => {
          expect([400, 409]).toContain(res.status);
        });
    });

    // TC-USER-021: 更新为无效的邮箱格式
    it('更新为无效的邮箱格式应该返回400', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });

    // TC-USER-022: 更新不存在的用户
    it('更新不存在的用户应该返回404', () => {
      return request(app.getHttpServer())
        .patch('/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `test_${Date.now()}@test.com`,
        })
        .expect(404);
    });
  });

  describe('DELETE /users/:id - 删除用户（仅管理员）', () => {
    let deleteTestUserId: number;

    beforeEach(async () => {
      // 每次测试前创建一个新用户用于删除
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'delete_test_' + Date.now(),
          email: `delete_test_${Date.now()}@test.com`,
          password: 'Test123456!',
          roleId: 3,
        });
      deleteTestUserId = res.body.id;
    });

    // TC-USER-023: 管理员成功删除用户
    it('管理员应该能成功删除用户', () => {
      return request(app.getHttpServer())
        .delete(`/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });

    // TC-USER-024: 面试官尝试删除用户（权限不足）
    it('面试官尝试删除用户应该返回403', () => {
      return request(app.getHttpServer())
        .delete(`/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(403);
    });

    // TC-USER-025: 候选人尝试删除用户（权限不足）
    it('候选人尝试删除用户应该返回403', () => {
      return request(app.getHttpServer())
        .delete(`/users/${deleteTestUserId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });

    // TC-USER-026: 删除不存在的用户
    it('删除不存在的用户应该返回404', () => {
      return request(app.getHttpServer())
        .delete('/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    // TC-USER-027: 管理员尝试删除自己
    it('管理员尝试删除自己应该返回400', () => {
      return request(app.getHttpServer())
        .delete(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          // 根据具体实现，可能返回400或其他状态码
          expect([400, 403]).toContain(res.status);
        });
    });
  });
});

