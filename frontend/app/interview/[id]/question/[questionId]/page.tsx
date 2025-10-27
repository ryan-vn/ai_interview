'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { interviewsApi, questionsApi, submissionsApi } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Save,
  Send,
  CheckCircle,
  Code2,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

interface Question {
  id: number;
  type: 'programming' | 'qa';
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  languageOptions?: string[];
  starterCode?: Record<string, string>;
  testCases?: Array<{ input: string; output: string }>;
  timeLimit?: number;
}

interface InterviewSession {
  id: number;
  name: string;
  status: string;
  actualStartAt: string | null;
  template: {
    id: number;
    name: string;
    timeLimit: number;
    questionIds: number[];
  };
}

export default function QuestionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Number(params.id);
  const questionId = Number(params.questionId);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // 答题状态
  const [answer, setAnswer] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // 计时器
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  // 加载数据
  useEffect(() => {
    loadSessionAndQuestions();
  }, [sessionId]);

  useEffect(() => {
    // 移除错误的 if (question) 判断
    loadQuestion();
  }, [questionId]);

  // 计时器
  useEffect(() => {
    if (!timerRunning || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, timeRemaining]);

  // 自动保存
  useEffect(() => {
    if (!answer) return;

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 5000); // 5秒后自动保存

    return () => clearTimeout(autoSaveTimer);
  }, [answer]);

  const loadSessionAndQuestions = async () => {
    try {
      console.log('开始加载面试信息，sessionId:', sessionId);
      const sessionResponse = await interviewsApi.getSession(sessionId);
      const sessionData = sessionResponse.data;
      console.log('面试信息加载成功:', sessionData);
      
      // 检查面试是否已完成
      if (sessionData.status === 'completed') {
        alert('该面试已结束，无法继续答题。\n您将被重定向到面试详情页。');
        window.location.href = `/interviews/${sessionId}`;
        return;
      }

      setSession(sessionData);

      // 计算剩余时间
      if (sessionData.actualStartAt) {
        const startTime = new Date(sessionData.actualStartAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const totalTime = sessionData.template.timeLimit;
        const remaining = Math.max(0, totalTime - elapsed);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(sessionData.template.timeLimit);
      }

      // 加载所有题目
      if (sessionData.template?.questionIds) {
        const questionPromises = sessionData.template.questionIds.map((qId: number) =>
          questionsApi.getOne(qId).catch(() => null)
        );
        const questionResults = await Promise.all(questionPromises);
        const questions = questionResults.filter(Boolean).map((r) => r.data);
        console.log('所有题目加载成功，数量:', questions.length);
        setAllQuestions(questions);

        const index = questions.findIndex((q) => q.id === questionId);
        if (index >= 0) {
          setCurrentQuestionIndex(index);
        }
      }
    } catch (error: any) {
      console.error('加载面试信息失败:', error);
      alert(`加载面试信息失败: ${error.message || '未知错误'}\n请检查您是否有权限访问该面试`);
    }
  };

  const loadQuestion = async () => {
    try {
      console.log('开始加载题目，questionId:', questionId);
      const response = await questionsApi.getOne(questionId);
      const questionData = response.data;
      console.log('题目加载成功:', questionData);
      setQuestion(questionData);

      // 设置默认语言
      if (questionData.type === 'programming' && questionData.languageOptions?.[0]) {
        setSelectedLanguage(questionData.languageOptions[0]);
        // 设置起始代码
        if (questionData.starterCode?.[questionData.languageOptions[0]]) {
          setAnswer(questionData.starterCode[questionData.languageOptions[0]]);
        }
      }

      // 检查是否已提交
      await checkSubmissionStatus();
    } catch (error: any) {
      console.error('加载题目失败:', error);
      alert(`加载题目失败: ${error.message || '未知错误'}\n请检查题目是否存在`);
    }
  };

  const checkSubmissionStatus = async () => {
    try {
      // 检查该题目是否已经提交过
      const response = await submissionsApi.getAll({ 
        sessionId, 
        questionId 
      });
      const submissions = response.data;
      
      if (submissions && submissions.length > 0) {
        setHasSubmitted(true);
        setSubmittedQuestions(prev => new Set(prev).add(questionId));
        // 加载已提交的答案
        const lastSubmission = submissions[0];
        setAnswer(lastSubmission.content || '');
        if (lastSubmission.language) {
          setSelectedLanguage(lastSubmission.language);
        }
      } else {
        setHasSubmitted(false);
      }
    } catch (error) {
      console.error('检查提交状态失败:', error);
      // 失败时不影响正常使用
    }
  };

  const handleAutoSave = async () => {
    if (!answer.trim()) return;

    setSaving(true);
    try {
      // 这里可以调用一个草稿保存接口
      // 暂时使用 localStorage
      localStorage.setItem(
        `draft_${sessionId}_${questionId}`,
        JSON.stringify({ answer, language: selectedLanguage, savedAt: new Date() })
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // 检查面试状态
    if (session?.status === 'completed') {
      alert('该面试已结束，无法提交答案');
      return;
    }

    if (!answer.trim()) {
      alert('请先输入答案');
      return;
    }

    // 检查是否已提交
    if (hasSubmitted) {
      if (!confirm('您已经提交过此题，确定要重新提交吗？这将覆盖之前的答案。')) {
        return;
      }
    } else {
      if (!confirm('确定要提交答案吗？提交后无法修改。')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await submissionsApi.create({
        sessionId,
        questionId,
        content: answer,
        language: question?.type === 'programming' ? selectedLanguage : undefined,
      });

      // 标记为已提交
      setHasSubmitted(true);
      setSubmittedQuestions(prev => new Set(prev).add(questionId));

      alert('提交成功！');
      
      // 清除草稿
      localStorage.removeItem(`draft_${sessionId}_${questionId}`);

      // 跳转到下一题或结束
      handleNext();
    } catch (error: any) {
      console.error('提交失败:', error);
      alert(error.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < allQuestions.length) {
      const nextQuestion = allQuestions[nextIndex];
      router.push(`/interview/${sessionId}/question/${nextQuestion.id}`);
    } else {
      // 所有题目完成，返回面试详情页
      if (confirm('所有题目已完成，是否结束面试？')) {
        handleCompleteInterview();
      }
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      const prevQuestion = allQuestions[prevIndex];
      router.push(`/interview/${sessionId}/question/${prevQuestion.id}`);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      await interviewsApi.completeSession(sessionId);
      router.push(`/interviews/${sessionId}`);
    } catch (error) {
      console.error('结束面试失败:', error);
    }
  };

  const handleTimeUp = () => {
    alert('时间已到，面试自动结束');
    handleCompleteInterview();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单';
      case 'medium':
        return '中等';
      case 'hard':
        return '困难';
      default:
        return difficulty;
    }
  };

  if (!question || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/interviews/${sessionId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              退出面试
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <span className="text-sm text-gray-600">
              题目 {currentQuestionIndex + 1} / {allQuestions.length}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* 自动保存状态 */}
            {saving ? (
              <span className="text-sm text-gray-500 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                保存中...
              </span>
            ) : lastSaved ? (
              <span className="text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                已保存
              </span>
            ) : null}

            {/* 计时器 */}
            <div className="flex items-center space-x-2">
              <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-500'}`} />
              <span className={`font-mono text-lg font-semibold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左侧：题目描述 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 题目信息卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {question.type === 'programming' ? (
                      <Code2 className="h-6 w-6 text-blue-600" />
                    ) : (
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    )}
                    <CardTitle className="text-2xl">{question.title}</CardTitle>
                    {hasSubmitted && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已提交
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                </div>
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {question.tags?.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br/>') }} />
                </div>

                {/* 测试用例 */}
                {question.testCases && question.testCases.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">测试用例</h3>
                    <div className="space-y-3">
                      {question.testCases.map((testCase, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div className="mb-2">
                            <span className="font-semibold text-gray-700">输入：</span>
                            <code className="ml-2 text-blue-600">{testCase.input}</code>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">输出：</span>
                            <code className="ml-2 text-green-600">{testCase.output}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 答题区域 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {question.type === 'programming' ? '代码编辑器' : '你的答案'}
                </CardTitle>
                {question.type === 'programming' && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">编程语言：</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      {question.languageOptions?.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {question.type === 'programming' ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      language={selectedLanguage}
                      value={answer}
                      onChange={(value) => setAnswer(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="请在此输入你的答案..."
                  />
                )}
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一题
              </Button>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleAutoSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? '保存中...' : '保存草稿'}
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || !answer.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      提交答案
                    </>
                  )}
                </Button>
                {currentQuestionIndex < allQuestions.length - 1 && (
                  <Button variant="outline" onClick={handleNext}>
                    下一题
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：题目列表 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">所有题目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allQuestions.map((q, index) => {
                    const isSubmitted = submittedQuestions.has(q.id);
                    const isCurrent = q.id === questionId;
                    return (
                      <button
                        key={q.id}
                        onClick={() => router.push(`/interview/${sessionId}/question/${q.id}`)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'bg-primary text-white border-primary'
                            : isSubmitted
                            ? 'bg-green-50 hover:bg-green-100 border-green-300'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isSubmitted && (
                              <CheckCircle className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-green-600'}`} />
                            )}
                            <span className="text-sm font-medium">
                              {index + 1}. {q.title}
                            </span>
                          </div>
                          {q.type === 'programming' ? (
                            <Code2 className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  注意事项
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 代码会每5秒自动保存</li>
                  <li>• 提交后无法修改答案</li>
                  <li>• 可以随时切换题目</li>
                  <li>• 注意把握时间</li>
                  <li>• 确保网络连接稳定</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

