import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin, TEST_QUESTIONS } from './test-helper';

describe('Questions Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let interviewerToken: string;
  let candidateToken: string;
  let testQuestionId: number;

  beforeAll(async () => {
    app = await createTestApp();

    // 创建测试用户
    const adminData = await registerAndLogin(app, {
      username: 'admin_questions_' + Date.now(),
      email: `admin_questions_${Date.now()}@test.com`,
      password: 'Admin123456!',
      roleId: 1,
    });
    adminToken = adminData.token;

    const interviewerData = await registerAndLogin(app, {
      username: 'interviewer_questions_' + Date.now(),
      email: `interviewer_questions_${Date.now()}@test.com`,
      password: 'Inter123456!',
      roleId: 2,
    });
    interviewerToken = interviewerData.token;

    const candidateData = await registerAndLogin(app, {
      username: 'candidate_questions_' + Date.now(),
      email: `candidate_questions_${Date.now()}@test.com`,
      password: 'Candi123456!',
      roleId: 3,
    });
    candidateToken = candidateData.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /questions - 创建题目（管理员/面试官）', () => {
    // TC-QUES-001: 管理员创建编程题
    it('管理员应该能创建编程题', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.programming,
          title: TEST_QUESTIONS.programming.title + '_' + Date.now(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('type', 'programming');
          expect(res.body).toHaveProperty('title');
          testQuestionId = res.body.id;
        });
    });

    // TC-QUES-002: 面试官创建问答题
    it('面试官应该能创建问答题', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          ...TEST_QUESTIONS.qa,
          title: TEST_QUESTIONS.qa.title + '_' + Date.now(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('type', 'qa');
        });
    });

    // TC-QUES-003: 候选人尝试创建题目（权限不足）
    it('候选人尝试创建题目应该返回403', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send(TEST_QUESTIONS.programming)
        .expect(403);
    });

    // TC-QUES-004: 创建题目时缺少必填字段
    it('缺少必填字段应该返回400', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'programming',
          title: '测试题目',
        })
        .expect(400);
    });

    // TC-QUES-005: 无效的题目类型
    it('无效的题目类型应该返回400', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'invalid_type',
          title: '测试题目',
          description: '描述',
          difficulty: 'easy',
        })
        .expect(400);
    });

    // TC-QUES-006: 无效的难度等级
    it('无效的难度等级应该返回400', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'programming',
          title: '测试题目',
          description: '描述',
          difficulty: 'invalid_difficulty',
        })
        .expect(400);
    });

    // TC-QUES-008: 题目标题过长
    it('题目标题过长应该返回400', () => {
      const longTitle = 'a'.repeat(500);
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'programming',
          title: longTitle,
          description: '描述',
          difficulty: 'easy',
        })
        .expect(400);
    });
  });

  describe('GET /questions - 获取所有题目', () => {
    beforeAll(async () => {
      // 创建多个不同类型和难度的题目
      await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.programming,
          title: '编程题_简单_' + Date.now(),
          difficulty: 'easy',
        });

      await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.programming,
          title: '编程题_中等_' + Date.now(),
          difficulty: 'medium',
        });

      await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.qa,
          title: '问答题_简单_' + Date.now(),
          difficulty: 'easy',
        });
    });

    // TC-QUES-009: 获取所有题目列表
    it('登录用户应该能获取所有题目列表', () => {
      return request(app.getHttpServer())
        .get('/questions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    // TC-QUES-010: 按类型筛选题目（编程题）
    it('应该能按类型筛选编程题', () => {
      return request(app.getHttpServer())
        .get('/questions?type=programming')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((q: any) => {
            expect(q.type).toBe('programming');
          });
        });
    });

    // TC-QUES-011: 按类型筛选题目（问答题）
    it('应该能按类型筛选问答题', () => {
      return request(app.getHttpServer())
        .get('/questions?type=qa')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((q: any) => {
            expect(q.type).toBe('qa');
          });
        });
    });

    // TC-QUES-012: 按难度筛选题目（简单）
    it('应该能按难度筛选简单题目', () => {
      return request(app.getHttpServer())
        .get('/questions?difficulty=easy')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((q: any) => {
            expect(q.difficulty).toBe('easy');
          });
        });
    });

    // TC-QUES-013: 按难度筛选题目（中等）
    it('应该能按难度筛选中等题目', () => {
      return request(app.getHttpServer())
        .get('/questions?difficulty=medium')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((q: any) => {
            expect(q.difficulty).toBe('medium');
          });
        });
    });

    // TC-QUES-015: 同时按类型和难度筛选
    it('应该能同时按类型和难度筛选', () => {
      return request(app.getHttpServer())
        .get('/questions?type=programming&difficulty=easy')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((q: any) => {
            expect(q.type).toBe('programming');
            expect(q.difficulty).toBe('easy');
          });
        });
    });

    // TC-QUES-016: 使用无效的筛选参数
    it('使用无效的筛选参数应该返回400', () => {
      return request(app.getHttpServer())
        .get('/questions?type=invalid')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(400);
    });

    // TC-QUES-018: 未登录获取题目列表
    it('未登录获取题目列表应该返回401', () => {
      return request(app.getHttpServer())
        .get('/questions')
        .expect(401);
    });
  });

  describe('GET /questions/:id - 获取题目详情', () => {
    let programmingQuestionId: number;
    let qaQuestionId: number;

    beforeAll(async () => {
      // 创建测试题目
      const progRes = await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.programming,
          title: '编程题详情测试_' + Date.now(),
        });
      programmingQuestionId = progRes.body.id;

      const qaRes = await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.qa,
          title: '问答题详情测试_' + Date.now(),
        });
      qaQuestionId = qaRes.body.id;
    });

    // TC-QUES-019: 获取存在的编程题详情
    it('应该能获取编程题详情', () => {
      return request(app.getHttpServer())
        .get(`/questions/${programmingQuestionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', programmingQuestionId);
          expect(res.body).toHaveProperty('type', 'programming');
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('description');
        });
    });

    // TC-QUES-020: 获取存在的问答题详情
    it('应该能获取问答题详情', () => {
      return request(app.getHttpServer())
        .get(`/questions/${qaQuestionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', qaQuestionId);
          expect(res.body).toHaveProperty('type', 'qa');
        });
    });

    // TC-QUES-021: 面试官/管理员查看题目详情（包含完整信息）
    it('管理员应该能查看题目完整信息', () => {
      return request(app.getHttpServer())
        .get(`/questions/${qaQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', qaQuestionId);
          // 管理员应该能看到参考答案等信息
        });
    });

    // TC-QUES-022: 获取不存在的题目
    it('获取不存在的题目应该返回404', () => {
      return request(app.getHttpServer())
        .get('/questions/99999')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(404);
    });

    // TC-QUES-023: 无效的题目ID格式
    it('无效的题目ID格式应该返回400', () => {
      return request(app.getHttpServer())
        .get('/questions/invalid_id')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(400);
    });
  });

  describe('PATCH /questions/:id - 更新题目（管理员/面试官）', () => {
    let updateQuestionId: number;

    beforeEach(async () => {
      // 每次测试前创建新题目
      const res = await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.programming,
          title: '更新测试题目_' + Date.now(),
        });
      updateQuestionId = res.body.id;
    });

    // TC-QUES-024: 管理员更新题目信息
    it('管理员应该能更新题目信息', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${updateQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '两数之和（更新版）',
          difficulty: 'medium',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', updateQuestionId);
          expect(res.body).toHaveProperty('difficulty', 'medium');
        });
    });

    // TC-QUES-025: 面试官更新题目
    it('面试官应该能更新题目', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${updateQuestionId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .send({
          description: '更新后的描述',
        })
        .expect(200);
    });

    // TC-QUES-027: 候选人尝试更新题目（权限不足）
    it('候选人尝试更新题目应该返回403', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${updateQuestionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: '非法更新',
        })
        .expect(403);
    });

    // TC-QUES-028: 更新为无效的数据
    it('更新为无效的数据应该返回400', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${updateQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          difficulty: 'invalid_level',
        })
        .expect(400);
    });

    // TC-QUES-029: 更新不存在的题目
    it('更新不存在的题目应该返回404', () => {
      return request(app.getHttpServer())
        .patch('/questions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '更新',
        })
        .expect(404);
    });
  });

  describe('DELETE /questions/:id - 删除题目（仅管理员）', () => {
    let deleteQuestionId: number;

    beforeEach(async () => {
      // 每次测试前创建新题目
      const res = await request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...TEST_QUESTIONS.programming,
          title: '删除测试题目_' + Date.now(),
        });
      deleteQuestionId = res.body.id;
    });

    // TC-QUES-031: 管理员成功删除题目
    it('管理员应该能成功删除题目', () => {
      return request(app.getHttpServer())
        .delete(`/questions/${deleteQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });

    // TC-QUES-032: 面试官尝试删除题目（权限不足）
    it('面试官尝试删除题目应该返回403', () => {
      return request(app.getHttpServer())
        .delete(`/questions/${deleteQuestionId}`)
        .set('Authorization', `Bearer ${interviewerToken}`)
        .expect(403);
    });

    // TC-QUES-033: 候选人尝试删除题目（权限不足）
    it('候选人尝试删除题目应该返回403', () => {
      return request(app.getHttpServer())
        .delete(`/questions/${deleteQuestionId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });

    // TC-QUES-034: 删除不存在的题目
    it('删除不存在的题目应该返回404', () => {
      return request(app.getHttpServer())
        .delete('/questions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

