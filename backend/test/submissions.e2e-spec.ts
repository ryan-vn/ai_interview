import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createTestApp,
  registerAndLogin,
  createTestQuestion,
  createTestTemplate,
  createTestSession,
  TEST_QUESTIONS,
} from './test-helper';

describe('Submissions Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let interviewerToken: string;
  let candidateToken: string;
  let candidateUserId: number;
  let candidate2Token: string;
  let candidate2UserId: number;
  let programmingQuestionId: number;
  let qaQuestionId: number;
  let templateId: number;
  let sessionId: number;

  beforeAll(async () => {
    app = await createTestApp();

    // 创建测试用户
    const adminData = await registerAndLogin(app, {
      username: 'admin_submissions_' + Date.now(),
      email: `admin_submissions_${Date.now()}@test.com`,
      password: 'Admin123456!',
      roleId: 1,
    });
    adminToken = adminData.token;

    const interviewerData = await registerAndLogin(app, {
      username: 'interviewer_submissions_' + Date.now(),
      email: `interviewer_submissions_${Date.now()}@test.com`,
      password: 'Inter123456!',
      roleId: 2,
    });
    interviewerToken = interviewerData.token;

    const candidateData = await registerAndLogin(app, {
      username: 'candidate_submissions_' + Date.now(),
      email: `candidate_submissions_${Date.now()}@test.com`,
      password: 'Candi123456!',
      roleId: 3,
    });
    candidateToken = candidateData.token;
    candidateUserId = candidateData.userId;

    const candidate2Data = await registerAndLogin(app, {
      username: 'candidate2_submissions_' + Date.now(),
      email: `candidate2_submissions_${Date.now()}@test.com`,
      password: 'Candi123456!',
      roleId: 3,
    });
    candidate2Token = candidate2Data.token;
    candidate2UserId = candidate2Data.userId;

    // 创建测试题目
    programmingQuestionId = await createTestQuestion(
      app,
      adminToken,
      {
        ...TEST_QUESTIONS.programming,
        title: TEST_QUESTIONS.programming.title + '_' + Date.now(),
      },
    );

    qaQuestionId = await createTestQuestion(
      app,
      adminToken,
      {
        ...TEST_QUESTIONS.qa,
        title: TEST_QUESTIONS.qa.title + '_' + Date.now(),
      },
    );

    // 创建测试模板
    templateId = await createTestTemplate(app, adminToken, {
      name: '提交测试模板_' + Date.now(),
      questionIds: [programmingQuestionId, qaQuestionId],
      timeLimit: 120,
    });

    // 创建测试面试场次
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    sessionId = await createTestSession(app, interviewerToken, {
      name: '提交测试面试_' + Date.now(),
      candidateId: candidateUserId,
      templateId: templateId,
      scheduledStartTime: startTime.toISOString(),
      scheduledEndTime: endTime.toISOString(),
    });

    // 开始面试
    await request(app.getHttpServer())
      .patch(`/interviews/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${candidateToken}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /submissions - 提交答案', () => {
    // TC-SUBM-001: 候选人成功提交编程题答案
    it('候选人应该能成功提交编程题答案', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'python',
          code: `def twoSum(nums, target):
    map = {}
    for i, num in enumerate(nums):
        if target - num in map:
            return [map[target - num], i]
        map[num] = i
    return []`,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('sessionId', sessionId);
          expect(res.body).toHaveProperty('questionId', programmingQuestionId);
        });
    });

    // TC-SUBM-002: 候选人提交问答题答案
    it('候选人应该能提交问答题答案', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: qaQuestionId,
          type: 'qa',
          answer: '我最有挑战的项目是开发一个实时数据分析平台，使用了微服务架构...',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('type', 'qa');
        });
    });

    // TC-SUBM-003: 提交到未开始的面试
    it('提交到未开始的面试应该返回400', async () => {
      // 创建一个新的未开始的面试
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const newSessionId = await createTestSession(app, interviewerToken, {
        name: '未开始面试_' + Date.now(),
        candidateId: candidateUserId,
        templateId: templateId,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
      });

      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: newSessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          code: 'test code',
        })
        .expect(400);
    });

    // TC-SUBM-004: 提交到已结束的面试
    it('提交到已结束的面试应该返回400', async () => {
      // 创建并完成一个面试
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const completedSessionId = await createTestSession(app, interviewerToken, {
        name: '已完成面试_' + Date.now(),
        candidateId: candidateUserId,
        templateId: templateId,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
      });

      // 开始并完成面试
      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${completedSessionId}/start`)
        .set('Authorization', `Bearer ${candidateToken}`);

      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${completedSessionId}/complete`)
        .set('Authorization', `Bearer ${candidateToken}`);

      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: completedSessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          code: 'test code',
        })
        .expect(400);
    });

    // TC-SUBM-005: 候选人提交其他人面试的答案
    it('候选人提交其他人面试的答案应该返回403', async () => {
      // 为candidate2创建面试
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const otherSessionId = await createTestSession(app, interviewerToken, {
        name: '其他候选人面试_' + Date.now(),
        candidateId: candidate2UserId,
        templateId: templateId,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
      });

      // candidate1尝试提交candidate2的面试答案
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: otherSessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          code: 'test code',
        })
        .expect(403);
    });

    // TC-SUBM-006: 缺少必填字段
    it('缺少必填字段应该返回400', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: programmingQuestionId,
        })
        .expect(400);
    });

    // TC-SUBM-007: 无效的面试场次ID
    it('无效的面试场次ID应该返回400或404', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: 99999,
          questionId: programmingQuestionId,
          type: 'programming',
          code: 'test code',
        })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });

    // TC-SUBM-008: 无效的题目ID
    it('无效的题目ID应该返回400或404', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: 99999,
          type: 'programming',
          code: 'test code',
        })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });

    // TC-SUBM-010: 编程题代码为空
    it('编程题代码为空应该返回400', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          code: '',
        })
        .expect(400);
    });

    // TC-SUBM-011: 问答题答案为空
    it('问答题答案为空应该返回400', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: qaQuestionId,
          type: 'qa',
          answer: '',
        })
        .expect(400);
    });

    // TC-SUBM-012: 重复提交同一题目
    it('应该允许重复提交同一题目', async () => {
      // 第一次提交
      await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'javascript',
          code: 'function twoSum() { return []; }',
        })
        .expect(201);

      // 第二次提交（应该成功，作为新版本）
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'javascript',
          code: 'function twoSum() { return [0,1]; }',
        })
        .expect(201);
    });

    // TC-SUBM-018: 提交使用不支持的编程语言
    it('提交使用不支持的编程语言应该返回400', () => {
      return request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: sessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'ruby',
          code: 'def two_sum; end',
        })
        .expect(400);
    });
  });

  describe('GET /submissions - 获取提交列表', () => {
    let testSessionId: number;
    let testSubmissionId: number;

    beforeAll(async () => {
      // 创建测试面试和提交
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      testSessionId = await createTestSession(app, interviewerToken, {
        name: '提交列表测试_' + Date.now(),
        candidateId: candidateUserId,
        templateId: templateId,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
      });

      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${testSessionId}/start`)
        .set('Authorization', `Bearer ${candidateToken}`);

      const submissionRes = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: testSessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'python',
          code: 'def twoSum(): pass',
        });
      testSubmissionId = submissionRes.body.id;
    });

    // TC-SUBM-019: 候选人获取自己的提交列表
    it('候选人应该能获取自己的提交列表', () => {
      return request(app.getHttpServer())
        .get('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // 验证只返回该候选人的提交
          res.body.forEach((sub: any) => {
            expect(sub.userId).toBe(candidateUserId);
          });
        });
    });

    // TC-SUBM-020: 面试官获取所有提交列表
    it('面试官应该能获取提交列表', () => {
      return request(app.getHttpServer())
        .get('/submissions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // TC-SUBM-021: 管理员获取所有提交列表
    it('管理员应该能获取所有提交列表', () => {
      return request(app.getHttpServer())
        .get('/submissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // TC-SUBM-022: 按面试场次筛选提交
    it('应该能按面试场次筛选提交', () => {
      return request(app.getHttpServer())
        .get(`/submissions?sessionId=${testSessionId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((sub: any) => {
            expect(sub.sessionId).toBe(testSessionId);
          });
        });
    });

    // TC-SUBM-023: 按用户ID筛选提交
    it('应该能按用户ID筛选提交', () => {
      return request(app.getHttpServer())
        .get(`/submissions?userId=${candidateUserId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((sub: any) => {
            expect(sub.userId).toBe(candidateUserId);
          });
        });
    });

    // TC-SUBM-024: 同时按场次和用户筛选
    it('应该能同时按场次和用户筛选', () => {
      return request(app.getHttpServer())
        .get(`/submissions?sessionId=${testSessionId}&userId=${candidateUserId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((sub: any) => {
            expect(sub.sessionId).toBe(testSessionId);
            expect(sub.userId).toBe(candidateUserId);
          });
        });
    });

    // TC-SUBM-027: 未登录获取提交列表
    it('未登录获取提交列表应该返回401', () => {
      return request(app.getHttpServer())
        .get('/submissions')
        .expect(401);
    });
  });

  describe('GET /submissions/:id - 获取提交详情', () => {
    let candidateSubmissionId: number;
    let otherCandidateSubmissionId: number;
    let candidate2SessionId: number;

    beforeAll(async () => {
      // 创建候选人1的提交
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const session1Id = await createTestSession(app, interviewerToken, {
        name: '提交详情测试1_' + Date.now(),
        candidateId: candidateUserId,
        templateId: templateId,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
      });

      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${session1Id}/start`)
        .set('Authorization', `Bearer ${candidateToken}`);

      const sub1Res = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          sessionId: session1Id,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'python',
          code: 'def test(): pass',
        });
      candidateSubmissionId = sub1Res.body.id;

      // 创建候选人2的提交
      candidate2SessionId = await createTestSession(app, interviewerToken, {
        name: '提交详情测试2_' + Date.now(),
        candidateId: candidate2UserId,
        templateId: templateId,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
      });

      await request(app.getHttpServer())
        .patch(`/interviews/sessions/${candidate2SessionId}/start`)
        .set('Authorization', `Bearer ${candidate2Token}`);

      const sub2Res = await request(app.getHttpServer())
        .post('/submissions')
        .set('Authorization', `Bearer ${candidate2Token}`)
        .send({
          sessionId: candidate2SessionId,
          questionId: programmingQuestionId,
          type: 'programming',
          language: 'python',
          code: 'def test2(): pass',
        });
      otherCandidateSubmissionId = sub2Res.body.id;
    });

    // TC-SUBM-028: 候选人获取自己的提交详情
    it('候选人应该能获取自己的提交详情', () => {
      return request(app.getHttpServer())
        .get(`/submissions/${candidateSubmissionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidateSubmissionId);
          expect(res.body).toHaveProperty('code');
          expect(res.body).toHaveProperty('questionId');
        });
    });

    // TC-SUBM-029: 面试官获取提交详情
    it('面试官应该能获取提交详情', () => {
      return request(app.getHttpServer())
        .get(`/submissions/${candidateSubmissionId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', candidateSubmissionId);
        });
    });

    // TC-SUBM-030: 管理员获取提交详情
    it('管理员应该能获取提交详情', () => {
      return request(app.getHttpServer())
        .get(`/submissions/${candidateSubmissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    // TC-SUBM-031: 候选人尝试获取其他人的提交详情
    it('候选人尝试获取其他人的提交详情应该返回403', () => {
      return request(app.getHttpServer())
        .get(`/submissions/${otherCandidateSubmissionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });

    // TC-SUBM-032: 获取不存在的提交
    it('获取不存在的提交应该返回404', () => {
      return request(app.getHttpServer())
        .get('/submissions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    // TC-SUBM-033: 无效的提交ID格式
    it('无效的提交ID格式应该返回400', () => {
      return request(app.getHttpServer())
        .get('/submissions/invalid_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});

