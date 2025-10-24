'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import {api} from '@/lib/api';

interface Statistics {
  jobs: { total: number };
  resumes: { total: number; statusCounts: any[] };
  questions: { total: number };
  interviews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics>({
    jobs: { total: 0 },
    resumes: { total: 0, statusCounts: [] },
    questions: { total: 0 },
    interviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [jobsRes, resumesRes, questionsRes, interviewsRes] = await Promise.all([
        api.get('/jobs?limit=1').catch(() => ({ data: { total: 0 } })),
        api.get('/resumes/statistics').catch(() => ({ data: { total: 0, statusCounts: [] } })),
        api.get('/questions/statistics').catch(() => ({ data: { total: 0 } })),
        api.get('/interviews/sessions').catch(() => ({ data: [] })),
      ]);

      setStats({
        jobs: { total: jobsRes.data.total || 0 },
        resumes: resumesRes.data,
        questions: questionsRes.data,
        interviews: Array.isArray(interviewsRes.data) ? interviewsRes.data.length : 0,
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: '岗位管理', href: '/admin/jobs', icon: '💼' },
    { title: '简历管理', href: '/admin/resumes', icon: '📄' },
    { title: '题库管理', href: '/questions', icon: '📝' },
    { title: '面试管理', href: '/admin/interviews', icon: '👥' },
    { title: '候选人管理', href: '/admin/candidates', icon: '👤' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">管理后台</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">招聘岗位</div>
          <div className="text-3xl font-bold">{stats.jobs.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">候选人简历</div>
          <div className="text-3xl font-bold">{stats.resumes.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">题库题目</div>
          <div className="text-3xl font-bold">{stats.questions.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">面试场次</div>
          <div className="text-3xl font-bold">{stats.interviews}</div>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">快捷入口</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.href}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => (window.location.href = action.href)}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{action.icon}</div>
              <div className="font-semibold">{action.title}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">系统说明</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ 岗位管理：创建和管理招聘岗位，设置技能要求</p>
          <p>✅ 简历管理：导入简历、结构化存储、智能匹配岗位</p>
          <p>✅ 题库管理：管理面试题目，支持编程题和行为面试题</p>
          <p>✅ 面试管理：创建面试场次，关联岗位和候选人</p>
          <p>✅ 匹配推荐：基于技能关键词的智能岗位匹配和推荐</p>
        </div>
      </Card>
    </div>
  );
}
