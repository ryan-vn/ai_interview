"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { questionsApi } from "@/lib/api";
import { Search, Code2, MessageSquare, ArrowLeft, Filter } from "lucide-react";

interface Question {
  id: number;
  title: string;
  description: string;
  type: 'programming' | 'qa';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  timeLimit?: number;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'programming' | 'qa'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    loadQuestions();
  }, [typeFilter, difficultyFilter]);

  const loadQuestions = async () => {
    try {
      const params: any = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (difficultyFilter !== 'all') params.difficulty = difficultyFilter;
      
      const response = await questionsApi.getAll(params);
      console.log('Questions API response:', response.data);
      
      // Handle the response structure
      const responseData = response.data;
      if (responseData && typeof responseData === 'object') {
        // Check if data is directly the array or nested
        const questionsData = Array.isArray(responseData) 
          ? responseData 
          : (Array.isArray(responseData.data) ? responseData.data : []);
        
        setQuestions(questionsData);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("加载题目失败:", error);
      setQuestions([]); // Ensure questions is always an array even on error
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

  const getTypeLabel = (type: string) => {
    return type === 'programming' ? '编程题' : '问答题';
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="ml-4 text-xl font-bold">题库管理</h1>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索题目标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 类型筛选 */}
              <div className="flex gap-2">
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                >
                  全部
                </Button>
                <Button
                  variant={typeFilter === 'programming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('programming')}
                >
                  <Code2 className="mr-1 h-4 w-4" />
                  编程题
                </Button>
                <Button
                  variant={typeFilter === 'qa' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('qa')}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  问答题
                </Button>
              </div>

              {/* 难度筛选 */}
              <div className="flex gap-2">
                <Button
                  variant={difficultyFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFilter('all')}
                >
                  全部难度
                </Button>
                <Button
                  variant={difficultyFilter === 'easy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFilter('easy')}
                >
                  简单
                </Button>
                <Button
                  variant={difficultyFilter === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFilter('medium')}
                >
                  中等
                </Button>
                <Button
                  variant={difficultyFilter === 'hard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFilter('hard')}
                >
                  困难
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 题目统计 */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{questions.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">总题目数</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {questions.filter(q => q.difficulty === 'easy').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">简单</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {questions.filter(q => q.difficulty === 'medium').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">中等</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {questions.filter(q => q.difficulty === 'hard').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">困难</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 题目列表 */}
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Code2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">没有找到题目</p>
                <p className="text-sm">请尝试调整筛选条件</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {question.type === 'programming' ? (
                          <Code2 className="h-5 w-5 text-blue-600" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                        )}
                        <CardTitle className="text-xl">{question.title}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {question.description}
                      </CardDescription>
                    </div>
                    <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {getDifficultyLabel(question.difficulty)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {getTypeLabel(question.type)}
                      </span>
                      {question.tags && question.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {question.timeLimit && (
                        <span className="px-2 py-1 text-xs rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          {question.timeLimit}分钟
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/questions/${question.id}`)}
                    >
                      查看详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

