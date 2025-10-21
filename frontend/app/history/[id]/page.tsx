"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsApi, interviewsApi, submissionsApi } from "@/lib/api";
import { 
  ArrowLeft, 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  Award,
  TrendingUp,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Submission {
  id: number;
  questionId: number;
  question: {
    title: string;
    type: string;
  };
  score: number;
  status: string;
  submittedAt: string;
}

interface Report {
  id: number;
  sessionId: number;
  overallScore: number;
  technicalScore: number;
  qaScore: number;
  status: string;
  summary: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
}

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadDetail();
    }
  }, [sessionId]);

  const loadDetail = async () => {
    try {
      const [sessionRes, submissionsRes] = await Promise.all([
        interviewsApi.getSession(Number(sessionId)),
        submissionsApi.getAll({ sessionId: Number(sessionId) })
      ]);

      setSession(sessionRes.data);
      setSubmissions(submissionsRes.data || []);

      // 尝试加载报告
      try {
        const reportRes = await reportsApi.getBySession(Number(sessionId));
        setReport(reportRes.data);
      } catch (error) {
        console.log("暂无报告");
      }
    } catch (error) {
      console.error("加载详情失败:", error);
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

  const getStatusIcon = (status: string) => {
    return status === 'success' ? CheckCircle : XCircle;
  };

  const handleDownloadReport = async () => {
    // TODO: 实现PDF下载
    alert('报告下载功能开发中...');
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

  const overallScore = report?.overallScore || 
    (submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length 
      : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" onClick={() => router.push('/history')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="ml-4 text-xl font-bold">面试结果</h1>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 总分卡片 */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {session?.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session?.completedAt && format(new Date(session.completedAt), 'PPP', { locale: zhCN })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                  {Math.round(overallScore)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  总分
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 评分详情 */}
        {report && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(report.technicalScore || 0)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">技术得分</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(report.qaScore || 0)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">问答得分</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold capitalize">{report.status}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">评估结果</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 题目详情 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>题目详情</CardTitle>
            <CardDescription>共完成 {submissions.length} 道题目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((submission, index) => {
                const StatusIcon = getStatusIcon(submission.status);
                return (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{submission.question.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {submission.question.type === 'programming' ? '编程题' : '问答题'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(submission.score)}`}>
                          {Math.round(submission.score)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">分</p>
                      </div>
                      <StatusIcon className={`h-6 w-6 ${submission.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI评价 */}
        {report && (
          <>
            {report.summary && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>AI 总结</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {report.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {(report.strengths || report.weaknesses) && (
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                {report.strengths && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600 dark:text-green-400">优势</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {report.strengths}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {report.weaknesses && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-orange-600 dark:text-orange-400">待改进</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {report.weaknesses}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {report.recommendations && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>建议</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {report.recommendations}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 操作按钮 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={handleDownloadReport}
                disabled={!report}
              >
                <Download className="mr-2 h-4 w-4" />
                下载完整报告
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/interviews/${sessionId}`)}
              >
                重新练习
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

