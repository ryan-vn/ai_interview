"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interviewsApi } from "@/lib/api";
import { Calendar, Clock, Play, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface InterviewSession {
  id: number;
  name: string;
  description: string;
  scheduledAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  template: {
    name: string;
    duration: number;
  };
}

export default function InterviewsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await interviewsApi.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error("加载面试场次失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: '未开始', color: 'text-gray-600 bg-gray-100', icon: Clock };
      case 'in_progress':
        return { label: '进行中', color: 'text-green-600 bg-green-100', icon: Play };
      case 'completed':
        return { label: '已完成', color: 'text-blue-600 bg-blue-100', icon: CheckCircle };
      case 'cancelled':
        return { label: '已取消', color: 'text-red-600 bg-red-100', icon: AlertCircle };
      default:
        return { label: status, color: 'text-gray-600 bg-gray-100', icon: Clock };
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return session.status === 'scheduled';
    if (filter === 'ongoing') return session.status === 'in_progress';
    if (filter === 'completed') return session.status === 'completed';
    return true;
  });

  const handleStartInterview = async (sessionId: number) => {
    router.push(`/interviews/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="ml-4 text-xl font-bold">我的面试</h1>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 标签导航 */}
        <div className="mb-6 flex space-x-2 border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'ongoing'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            进行中
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'upcoming'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            即将开始
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'completed'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            已完成
          </button>
        </div>

        {/* 面试场次列表 */}
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">暂无面试安排</p>
                <p className="text-sm">您当前没有符合筛选条件的面试场次</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const statusInfo = getStatusInfo(session.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{session.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {session.template.name}
                        </CardDescription>
                      </div>
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          预约时间: {new Date(session.scheduledAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          时长: {session.template.duration} 分钟
                        </span>
                      </div>
                      {session.actualStartAt && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Play className="mr-2 h-4 w-4" />
                          <span>
                            开始于: {formatDistanceToNow(new Date(session.actualStartAt), { 
                              addSuffix: true, 
                              locale: zhCN 
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-3 flex space-x-2">
                        {session.status === 'in_progress' && (
                          <Button 
                            className="flex-1" 
                            onClick={() => handleStartInterview(session.id)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            继续面试
                          </Button>
                        )}
                        {session.status === 'scheduled' && (
                          <Button 
                            className="flex-1"
                            onClick={() => handleStartInterview(session.id)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            开始面试
                          </Button>
                        )}
                        {session.status === 'completed' && (
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push(`/history/${session.id}`)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            查看结果
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => router.push(`/interviews/${session.id}`)}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

