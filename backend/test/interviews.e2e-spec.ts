import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  registerAndLogin,
  createTestQuestion,
  TEST_QUESTIONS,
} from './test-helper';

describe('Interviews Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminUserId: number;
  let interviewerToken: string;
  let candidateToken: string;
  let candidateUserId: number;
  let candidate2Token: string;
  let candidate2UserId: number;
  let testQuestionId: number;
  let testTemplateId: number;

  beforeAll(async () => {
    app = await createTestApp();

    // 创建测试用户
    const adminData = await registerAndLogin(app, {
      username: 'admin_interviews_' + Date.now(),
      email: `admin_interviews_${Date.now()}@test.com`,
      password: 'Admin123456!',
      roleId: 1,
    });
    adminToken = adminData.token;
    adminUserId = adminData.userId;

    const interviewerData = await registerAndLogin(app, {
      username: 'interviewer_interviews_' + Date.now(),
      email: `interviewer_interviews_${Date.now()}@test.com`,
      password: 'Inter123456!',
      roleId: 2,
    });
    interviewerToken = interviewerData.token;

    const candidateData = await registerAndLogin(app, {
      username: 'candidate_interviews_' + Date.now(),
      email: `candidate_interviews_${Date.now()}@test.com`,
      password: 'Candi123456!',
      roleId: 3,
    });
    candidateToken = candidateData.token;
    candidateUserId = candidateData.userId;

    const candidate2Data = await registerAndLogin(app, {
      username: 'candidate2_interviews_' + Date.now(),
      email: `candidate2_interviews_${Date.now()}@test.com`,
      password: 'Candi123456!',
      roleId: 3,
    });
    candidate2Token = candidate2Data.token;
    candidate2UserId = candidate2Data.userId;

    // 创建测试题目
    testQuestionId = await createTestQuestion(
      app,
      adminToken,
      TEST_QUESTIONS.programming,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /interviews/templates - 创建面试模板', () => {
    // TC-INTV-031: 管理员创建面试模板
    it('管理员应该能创建面试模板', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '前端工程师标准面试_' + Date.now(),
          description: '包含算法题、前端框架题和系统设计题',
          questionIds: [testQuestionId],
          timeLimit: 120,
          passingScore: 60,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          testTemplateId = res.body.id;
        });
    });

    // TC-INTV-032: 面试官创建面试模板
    it('面试官应该能创建面试模板', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '后端工程师面试_' + Date.now(),
          description: '后端面试题目',
          questionIds: [testQuestionId],
          timeLimit: 90,
        })
        .expect(201);
    });

    // TC-INTV-033: 候选人尝试创建模板（权限不足）
    it('候选人尝试创建模板应该返回403', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          name: '测试模板',
          questionIds: [testQuestionId],
          timeLimit: 60,
        })
        .expect(403);
    });

    // TC-INTV-034: 缺少必填字段
    it('缺少必填字段应该返回400', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '测试模板',
        })
        .expect(400);
    });

    // TC-INTV-035: 题目ID列表为空
    it('题目ID列表为空应该返回400', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '测试模板',
          questionIds: [],
          timeLimit: 60,
        })
        .expect(400);
    });

    // TC-INTV-036: 包含不存在的题目ID
    it('包含不存在的题目ID应该返回400或404', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '测试模板',
          questionIds: [testQuestionId, 99999],
          timeLimit: 60,
        })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });

    // TC-INTV-037: 无效的时间限制
    it('无效的时间限制应该返回400', () => {
      return request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '测试模板',
          questionIds: [testQuestionId],
          timeLimit: -10,
        })
        .expect(400);
    });
  });

  describe('GET /interviews/templates - 获取所有面试模板', () => {
    // TC-INTV-038: 获取所有面试模板列表
    it('登录用户应该能获取所有模板列表', () => {
      return request(app.getHttpServer())
        .get('/interviews/templates')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // TC-INTV-040: 未登录获取模板列表
    it('未登录获取模板列表应该返回401', () => {
      return request(app.getHttpServer())
        .get('/interviews/templates')
        .expect(401);
    });
  });

  describe('GET /interviews/templates/:id - 获取模板详情', () => {
    // TC-INTV-041: 获取存在的模板详情
    it('应该能获取存在的模板详情', () => {
      return request(app.getHttpServer())
        .get(`/interviews/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testTemplateId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('questionIds');
        });
    });

    // TC-INTV-042: 获取不存在的模板
    it('获取不存在的模板应该返回404', () => {
      return request(app.getHttpServer())
        .get('/interviews/templates/99999')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(404);
    });

    // TC-INTV-043: 无效的模板ID格式
    it('无效的模板ID格式应该返回400', () => {
      return request(app.getHttpServer())
        .get('/interviews/templates/invalid_id')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(400);
    });
  });

  describe('POST /interviews/sessions - 创建面试场次', () => {
    // TC-INTV-001: 成功创建面试场次
    it('应该能成功创建面试场次', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 明天
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2小时后

      return request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '前端工程师面试 - 候选人' + Date.now(),
          candidateId: candidateUserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('status');
        });
    });

    // TC-INTV-005: 缺少必填字段
    it('缺少必填字段应该返回400', () => {
      return request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '测试面试',
        })
        .expect(400);
    });

    // TC-INTV-006: 无效的候选人ID
    it('无效的候选人ID应该返回400或404', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      return request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '测试面试',
          candidateId: 99999,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });

    // TC-INTV-007: 无效的模板ID
    it('无效的模板ID应该返回400或404', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      return request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '测试面试',
          candidateId: candidateUserId,
          templateId: 99999,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });

    // TC-INTV-008: 结束时间早于开始时间
    it('结束时间早于开始时间应该返回400', () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);

      return request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '测试面试',
          candidateId: candidateUserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        })
        .expect(400);
    });
  });

  describe('GET /interviews/sessions - 获取面试场次列表', () => {
    let sessionId: number;

    beforeAll(async () => {
      // 创建测试面试场次
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const res = await request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '列表测试面试_' + Date.now(),
          candidateId: candidateUserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        });
      sessionId = res.body.id;
    });

    // TC-INTV-010: 候选人获取自己的面试列表
    it('候选人应该能获取自己的面试列表', () => {
      return request(app.getHttpServer())
        .get('/interviews/sessions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // 验证只返回该候选人的面试
          res.body.forEach((session: any) => {
            expect(session.candidateId).toBe(candidateUserId);
          });
        });
    });

    // TC-INTV-011: 面试官获取所有面试列表
    it('面试官应该能获取面试列表', () => {
      return request(app.getHttpServer())
        .get('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // TC-INTV-012: 管理员获取所有面试列表
    it('管理员应该能获取所有面试列表', () => {
      return request(app.getHttpServer())
        .get('/interviews/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // TC-INTV-014: 未登录获取面试列表
    it('未登录获取面试列表应该返回401', () => {
      return request(app.getHttpServer())
        .get('/interviews/sessions')
        .expect(401);
    });
  });

  describe('GET /interviews/sessions/:id - 获取面试场次详情', () => {
    let candidateSessionId: number;
    let otherCandidateSessionId: number;

    beforeAll(async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      // 为候选人1创建面试
      const res1 = await request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '候选人1面试_' + Date.now(),
          candidateId: candidateUserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        });
      candidateSessionId = res1.body.id;

      // 为候选人2创建面试
      const res2 = await request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '候选人2面试_' + Date.now(),
          candidateId: candidate2UserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        });
      otherCandidateSessionId = res2.body.id;
    });

    // TC-INTV-015: 候选人获取自己的面试详情
    it('候选人应该能获取自己的面试详情', () => {
      return request(app.getHttpServer())
        .get(`/interviews/sessions/${candidateSessionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidateSessionId);
          expect(res.body).toHaveProperty('candidateId', candidateUserId);
        });
    });

    // TC-INTV-016: 面试官获取面试详情
    it('面试官应该能获取面试详情', () => {
      return request(app.getHttpServer())
        .get(`/interviews/sessions/${candidateSessionId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200);
    });

    // TC-INTV-017: 候选人尝试获取其他人的面试详情
    it('候选人尝试获取其他人的面试详情应该返回403', () => {
      return request(app.getHttpServer())
        .get(`/interviews/sessions/${otherCandidateSessionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });

    // TC-INTV-018: 获取不存在的面试场次
    it('获取不存在的面试场次应该返回404', () => {
      return request(app.getHttpServer())
        .get('/interviews/sessions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    // TC-INTV-019: 无效的场次ID格式
    it('无效的场次ID格式应该返回400', () => {
      return request(app.getHttpServer())
        .get('/interviews/sessions/invalid_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PATCH /interviews/sessions/:id/start - 开始面试', () => {
    let startSessionId: number;

    beforeEach(async () => {
      // 每次测试前创建新面试场次
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const res = await request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '开始测试面试_' + Date.now(),
          candidateId: candidateUserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        });
      startSessionId = res.body.id;
    });

    // TC-INTV-020: 候选人成功开始面试
    it('候选人应该能成功开始面试', () => {
      return request(app.getHttpServer())
        .patch(`/interviews/sessions/${startSessionId}/start`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'in_progress');
        });
    });

    // TC-INTV-023: 重复开始已进行中的面试
    it('重复开始已进行中的面试应该返回400', async () => {
      // 先开始面试
      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${startSessionId}/start`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      // 再次开始应该失败
      return request(app.getHttpServer())
        .patch(`/interviews/sessions/${startSessionId}/start`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(400);
    });

    // TC-INTV-025: 开始不存在的面试
    it('开始不存在的面试应该返回404', () => {
      return request(app.getHttpServer())
        .patch('/interviews/sessions/99999/start')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(404);
    });
  });

  describe('PATCH /interviews/sessions/:id/complete - 完成面试', () => {
    let completeSessionId: number;

    beforeEach(async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const res = await request(app.getHttpServer())
        .post('/interviews/sessions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          name: '完成测试面试_' + Date.now(),
          candidateId: candidateUserId,
          templateId: testTemplateId,
          scheduledStartTime: startTime.toISOString(),
          scheduledEndTime: endTime.toISOString(),
        });
      completeSessionId = res.body.id;

      // 开始面试
      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${completeSessionId}/start`)
        .set('Authorization', `Bearer ${candidateToken}`);
    });

    // TC-INTV-026: 候选人成功完成面试
    it('候选人应该能成功完成面试', () => {
      return request(app.getHttpServer())
        .patch(`/interviews/sessions/${completeSessionId}/complete`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'completed');
        });
    });

    // TC-INTV-029: 重复完成已结束的面试
    it('重复完成已结束的面试应该返回400', async () => {
      // 先完成面试
      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${completeSessionId}/complete`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      // 再次完成应该失败
      return request(app.getHttpServer())
        .patch(`/interviews/sessions/${completeSessionId}/complete`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(400);
    });
  });

  describe('DELETE /interviews/templates/:id - 删除模板（仅管理员）', () => {
    let deleteTemplateId: number;

    beforeEach(async () => {
      // 每次测试前创建新模板
      const res = await request(app.getHttpServer())
        .post('/interviews/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '删除测试模板_' + Date.now(),
          questionIds: [testQuestionId],
          timeLimit: 60,
        });
      deleteTemplateId = res.body.id;
    });

    // TC-INTV-044: 管理员成功删除模板
    it('管理员应该能成功删除模板', () => {
      return request(app.getHttpServer())
        .delete(`/interviews/templates/${deleteTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });

    // TC-INTV-045: 面试官尝试删除模板（权限不足）
    it('面试官尝试删除模板应该返回403', () => {
      return request(app.getHttpServer())
        .delete(`/interviews/templates/${deleteTemplateId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(403);
    });

    // TC-INTV-046: 候选人尝试删除模板（权限不足）
    it('候选人尝试删除模板应该返回403', () => {
      return request(app.getHttpServer())
        .delete(`/interviews/templates/${deleteTemplateId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });

    // TC-INTV-047: 删除不存在的模板
    it('删除不存在的模板应该返回404', () => {
      return request(app.getHttpServer())
        .delete('/interviews/templates/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

