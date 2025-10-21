"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { questionsApi } from "@/lib/api";
import { ArrowLeft, Code2, MessageSquare, Clock, Database } from "lucide-react";

interface Question {
  id: number;
  title: string;
  description: string;
  type: 'programming' | 'qa';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  timeLimit?: number;
  memoryLimit?: number;
  languageOptions?: string[];
  testCases?: any[];
  starterCode?: Record<string, string>;
}

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (questionId) {
      loadQuestion();
    }
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      const response = await questionsApi.getOne(Number(questionId));
      setQuestion(response.data);
    } catch (error) {
      console.error("加载题目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'hard':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100';
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

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">题目不存在</p>
            <Button onClick={() => router.push('/questions')}>
              返回题库
            </Button>
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
          <Button variant="ghost" onClick={() => router.push('/questions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回题库
          </Button>
          <h1 className="ml-4 text-xl font-bold">{question.title}</h1>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左侧 - 题目详情 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {question.type === 'programming' ? (
                      <Code2 className="h-6 w-6 text-blue-600" />
                    ) : (
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    )}
                    <CardTitle className="text-2xl">{question.title}</CardTitle>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{question.description}</div>
                </div>
              </CardContent>
            </Card>

            {/* 测试用例 */}
            {question.type === 'programming' && question.testCases && question.testCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>示例</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {question.testCases.slice(0, 2).map((testCase, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                        <p className="font-semibold mb-2">示例 {index + 1}:</p>
                        <div className="space-y-2 text-sm font-mono">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">输入: </span>
                            <span>{testCase.input}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">输出: </span>
                            <span>{testCase.expectedOutput || testCase.output}</span>
                          </div>
                          {testCase.explanation && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">解释: </span>
                              <span>{testCase.explanation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 代码模板 */}
            {question.type === 'programming' && question.starterCode && (
              <Card>
                <CardHeader>
                  <CardTitle>代码模板</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(question.starterCode).map(([lang, code]) => (
                      <div key={lang}>
                        <p className="text-sm font-semibold mb-2 capitalize">{lang}</p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧 - 题目信息 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>题目信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">类型</span>
                  <span className="font-medium">
                    {question.type === 'programming' ? '编程题' : '问答题'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">难度</span>
                  <span className={`font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                </div>
                {question.timeLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      时间限制
                    </span>
                    <span className="font-medium">{question.timeLimit} 分钟</span>
                  </div>
                )}
                {question.memoryLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Database className="mr-1 h-4 w-4" />
                      内存限制
                    </span>
                    <span className="font-medium">{question.memoryLimit} MB</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 标签 */}
            {question.tags && question.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>标签</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 支持的语言 */}
            {question.type === 'programming' && question.languageOptions && question.languageOptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>支持的语言</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {question.languageOptions.map((lang, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

