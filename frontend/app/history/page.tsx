"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interviewsApi } from "@/lib/api";
import { Clock, Calendar, TrendingUp, Award, ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface HistorySession {
  id: number;
  name: string;
  completedAt: string;
  status: string;
  template: {
    name: string;
  };
  // 这些字段可能来自报告或评分记录
  overallScore?: number;
  duration?: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    passedSessions: 0,
    totalTime: 0
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await interviewsApi.getSessions();
      const completedSessions = response.data.filter(
        (s: HistorySession) => s.status === 'completed'
      );
      setSessions(completedSessions);
      
      // 计算统计数据
      const total = completedSessions.length;
      const avgScore = completedSessions.reduce((sum: number, s: HistorySession) => 
        sum + (s.overallScore || 0), 0) / (total || 1);
      const passed = completedSessions.filter((s: HistorySession) => 
        (s.overallScore || 0) >= 60).length;
      const totalTime = completedSessions.reduce((sum: number, s: HistorySession) => 
        sum + (s.duration || 0), 0);
      
      setStats({
        totalSessions: total,
        averageScore: Math.round(avgScore * 10) / 10,
        passedSessions: passed,
        totalTime
      });
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 60) return '及格';
    return '不及格';
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
          <h1 className="ml-4 text-xl font-bold">历史记录</h1>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">完成场次</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageScore}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">平均分</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.passedSessions}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">通过数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.totalTime / 60)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">总时长(小时)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 历史记录列表 */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">暂无面试记录</p>
                <p className="text-sm">完成面试后，历史记录将显示在这里</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>面试历史</CardTitle>
              <CardDescription>共 {sessions.length} 场面试</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{session.name}</h3>
                      <div className="flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>
                            {format(new Date(session.completedAt), 'PPP', { locale: zhCN })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{session.template.name}</span>
                        </div>
                        {session.duration && (
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>用时: {session.duration} 分钟</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {session.overallScore !== undefined && (
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${getScoreColor(session.overallScore)}`}>
                            {session.overallScore}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getScoreLabel(session.overallScore)}
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/history/${session.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

