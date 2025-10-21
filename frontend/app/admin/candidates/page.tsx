'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar,
  Plus,
  Eye,
  UserPlus
} from 'lucide-react';
import { interviewsApi } from '@/lib/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Candidate {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  interviewCount: number;
  firstInterviewDate: string;
  lastInterviewDate: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await interviewsApi.getCandidates();
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (candidate.position && candidate.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载候选人数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">候选人管理</h1>
              <p className="text-gray-600 mt-2">管理所有候选人信息和面试记录</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/admin/interviews/create'}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>创建面试</span>
            </Button>
          </div>
        </div>

        {/* 搜索和统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">总候选人数</p>
                  <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">活跃候选人</p>
                  <p className="text-2xl font-bold text-green-600">
                    {candidates.filter(c => c.interviewCount > 0).length}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">平均面试次数</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {candidates.length > 0 
                      ? (candidates.reduce((sum, c) => sum + c.interviewCount, 0) / candidates.length).toFixed(1)
                      : 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">本月新增</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {candidates.filter(c => {
                      const candidateDate = new Date(c.firstInterviewDate);
                      const now = new Date();
                      return candidateDate.getMonth() === now.getMonth() && 
                             candidateDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索栏 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索候选人姓名、邮箱或职位..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 候选人列表 */}
        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无候选人数据</h3>
                  <p className="text-gray-600 mb-4">开始创建面试场次来添加候选人</p>
                  <Button onClick={() => window.location.href = '/admin/interviews/create'}>
                    创建面试
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* 候选人信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {candidate.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {candidate.email}
                            </span>
                            {candidate.phone && (
                              <span className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {candidate.phone}
                              </span>
                            )}
                            {candidate.position && (
                              <span className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {candidate.position}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {candidate.interviewCount} 次面试
                        </Badge>
                      </div>

                      {/* 面试统计 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>首次面试：</strong>{format(new Date(candidate.firstInterviewDate), 'yyyy-MM-dd', { locale: zhCN })}</p>
                          <p><strong>最近面试：</strong>{format(new Date(candidate.lastInterviewDate), 'yyyy-MM-dd', { locale: zhCN })}</p>
                        </div>
                        <div>
                          <p><strong>面试频率：</strong>
                            {candidate.interviewCount > 1 
                              ? `${Math.round((new Date(candidate.lastInterviewDate).getTime() - new Date(candidate.firstInterviewDate).getTime()) / (1000 * 60 * 60 * 24) / (candidate.interviewCount - 1))} 天/次`
                              : '首次面试'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col space-y-2 lg:min-w-[200px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/admin/interviews/create'}
                        className="w-full flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>创建面试</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/admin/interviews'}
                        className="w-full flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>查看面试</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
