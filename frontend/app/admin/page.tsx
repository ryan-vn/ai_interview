'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Plus, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Settings,
  Mail,
  Link
} from 'lucide-react';
import { interviewsApi } from '@/lib/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface InterviewSession {
  id: number;
  name: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  scheduledAt: string;
  inviteToken: string;
  template: {
    name: string;
    duration: number;
  };
  createdAt: string;
}

interface DashboardStats {
  totalSessions: number;
  scheduledSessions: number;
  inProgressSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  recentSessions: InterviewSession[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    scheduledSessions: 0,
    inProgressSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    recentSessions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 使用HR专用API获取统计数据
      const response = await interviewsApi.getHrStatistics();
      const sessionsResponse = await interviewsApi.getAllSessionsForHr();
      const sessions = sessionsResponse.data;
      
      const stats: DashboardStats = {
        totalSessions: response.data.totalSessions,
        scheduledSessions: response.data.scheduledSessions,
        inProgressSessions: response.data.inProgressSessions,
        completedSessions: response.data.completedSessions,
        cancelledSessions: response.data.cancelledSessions,
        recentSessions: sessions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { variant: 'secondary', text: '已安排' },
      in_progress: { variant: 'default', text: '进行中' },
      completed: { variant: 'outline', text: '已完成' },
      cancelled: { variant: 'destructive', text: '已取消' },
    };
    const config = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge variant={config.variant as any}>{config.text}</Badge>;
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      // 可以添加toast通知
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载仪表板数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HR 管理仪表板</h1>
          <p className="text-gray-600 mt-2">管理面试场次、生成邀请链接、查看统计数据</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">总面试数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">已安排</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduledSessions}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">进行中</p>
                  <p className="text-2xl font-bold text-green-600">{stats.inProgressSessions}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.completedSessions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">已取消</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelledSessions}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/interviews/create')}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">创建面试</h3>
                  <p className="text-sm text-gray-600">创建新的面试场次</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/interviews/batch')}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">批量创建</h3>
                  <p className="text-sm text-gray-600">批量创建多个面试</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/interviews')}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">管理面试</h3>
                  <p className="text-sm text-gray-600">查看和管理所有面试</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/candidates')}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">候选人管理</h3>
                  <p className="text-sm text-gray-600">管理候选人信息</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/questions')}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">题库管理</h3>
                  <p className="text-sm text-gray-600">管理面试题目</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/templates')}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">模板管理</h3>
                  <p className="text-sm text-gray-600">管理面试模板</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                快速操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/admin/interviews/create')}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>创建面试场次</span>
                </Button>
                <Button 
                  onClick={() => router.push('/admin/interviews/batch')}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>批量创建面试</span>
                </Button>
                <Button 
                  onClick={() => router.push('/admin/candidates')}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>管理候选人</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 最近的面试场次 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>最近的面试场次</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/interviews')}
                >
                  查看全部
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">暂无面试记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(session.status)}
                          <h4 className="font-medium text-gray-900">{session.name}</h4>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          候选人: {session.candidateName} ({session.candidateEmail})
                        </p>
                        <p className="text-sm text-gray-500">
                          时间: {format(new Date(session.scheduledAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(session.inviteToken)}
                          className="flex items-center space-x-1"
                        >
                          <Link className="h-3 w-3" />
                          <span>复制链接</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/interviews/${session.id}`)}
                        >
                          查看
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快速统计 */}
          <Card>
            <CardHeader>
              <CardTitle>面试统计概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">完成率</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats.totalSessions > 0 
                      ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                      : 0}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>已完成</span>
                    <span>{stats.completedSessions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>进行中</span>
                    <span>{stats.inProgressSessions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalSessions > 0 ? (stats.inProgressSessions / stats.totalSessions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>已安排</span>
                    <span>{stats.scheduledSessions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalSessions > 0 ? (stats.scheduledSessions / stats.totalSessions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">总面试数</span>
                    <span className="font-bold text-lg">{stats.totalSessions}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
