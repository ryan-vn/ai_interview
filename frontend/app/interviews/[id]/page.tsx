"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interviewsApi, questionsApi } from "@/lib/api";
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Code2,
  MessageSquare,
  ChevronRight
} from "lucide-react";

interface InterviewSession {
  id: number;
  name: string;
  description: string;
  status: string;
  scheduledAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  template: {
    id: number;
    name: string;
    description: string;
    duration: number;
    questionIds: number[];
  };
}

interface Question {
  id: number;
  title: string;
  type: 'programming' | 'qa';
  difficulty: string;
}

export default function InterviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSessionDetail();
    }
  }, [sessionId]);

  const loadSessionDetail = async () => {
    try {
      const response = await interviewsApi.getSession(Number(sessionId));
      setSession(response.data);
      
      // 加载题目信息
      if (response.data.template?.questionIds) {
        const questionPromises = response.data.template.questionIds.map((qId: number) =>
          questionsApi.getOne(qId).catch(() => null)
        );
        const questionResults = await Promise.all(questionPromises);
        setQuestions(questionResults.filter(Boolean).map(r => r.data));
      }
    } catch (error) {
      console.error("加载面试详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      // 如果面试已完成，不允许继续
      if (session?.status === 'completed') {
        alert('该面试已结束，无法继续答题。您可以查看面试结果或联系管理员。');
        return;
      }

      if (session?.status === 'scheduled') {
        await interviewsApi.startSession(Number(sessionId));
      }
      // 跳转到第一道题
      if (questions.length > 0) {
        router.push(`/interview/${sessionId}/question/${questions[0].id}`);
      }
    } catch (error) {
      console.error("开始面试失败:", error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">未找到面试</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                该面试场次不存在或您没有权限访问
              </p>
              <Button onClick={() => router.push('/interviews')}>
                返回面试列表
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" onClick={() => router.push('/interviews')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="ml-4 text-xl font-bold">{session.name}</h1>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 面试信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{session.name}</CardTitle>
            <CardDescription>
              {session.template.description || session.template.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  时长: {session.template.duration} 分钟
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  题目数: {questions.length} 道
                </span>
              </div>
            </div>

            {session.status === 'completed' && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      面试已完成
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      该面试已于 {session.actualEndAt ? new Date(session.actualEndAt).toLocaleString('zh-CN') : '未知时间'} 结束，无法继续答题
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 题目列表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>题目列表</CardTitle>
            <CardDescription>共 {questions.length} 道题目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      {question.type === 'programming' ? (
                        <Code2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      )}
                      <div>
                        <h3 className="font-semibold">{question.title}</h3>
                        <p className={`text-sm ${getDifficultyColor(question.difficulty)}`}>
                          {getDifficultyLabel(question.difficulty)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (session.status === 'completed') {
                        alert('该面试已结束，无法继续答题');
                        return;
                      }
                      router.push(`/interview/${sessionId}/question/${question.id}`);
                    }}
                    disabled={session.status === 'completed'}
                  >
                    {session.status === 'completed' ? '已结束' : '开始'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-3">
              {session.status !== 'completed' ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleStartInterview}
                  disabled={questions.length === 0}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {session.status === 'in_progress' ? '继续面试' : '开始面试'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  variant="outline"
                  disabled
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  面试已结束
                </Button>
              )}
              
              {session.status === 'completed' && (
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => router.push(`/history/${sessionId}`)}
                >
                  查看面试结果
                </Button>
              )}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-semibold mb-1">温馨提示：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>请确保网络连接稳定</li>
                    <li>建议在电脑上完成面试以获得最佳体验</li>
                    <li>代码会自动保存，请放心作答</li>
                    <li>面试过程中请勿切换标签页或关闭浏览器</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

