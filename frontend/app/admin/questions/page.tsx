"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { questionsApi, tagsApi } from "@/lib/api";
import { 
  Search, 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  Tag, 
  Download,
  Filter,
  FileText,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  title: string;
  description: string;
  type: 'programming' | 'qa' | 'behavioral' | 'technical_qa';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  creator?: {
    username: string;
  };
}

interface QuestionTag {
  id: number;
  name: string;
  category: string;
  color?: string;
}

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadTags();
  }, [page, typeFilter, difficultyFilter, selectedTags]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
      };
      if (typeFilter) params.type = typeFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      if (searchTerm) params.keyword = searchTerm;
      
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
        setTotal(responseData.total || questionsData.length);
      } else {
        setQuestions([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      toast({
        title: "加载失败",
        description: error.message || "加载题目列表失败",
        variant: "destructive",
      });
      setQuestions([]); // Ensure questions is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagsApi.getAll();
      console.log('Tags API response:', response.data);
      
      // Handle the response structure - tags might be directly in data or nested
      const tagsData = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.data) ? response.data.data : []);
      
      setTags(tagsData);
    } catch (error) {
      console.error("加载标签失败:", error);
      setTags([]); // Ensure tags is always an array
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadQuestions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这道题目吗？')) return;
    
    try {
      await questionsApi.delete(id);
      toast({
        title: "删除成功",
        description: "题目已成功删除",
      });
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message || "删除题目失败",
        variant: "destructive",
      });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "请选择题目",
        description: "请先选择要删除的题目",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedQuestions.length} 道题目吗？`)) return;
    
    try {
      await questionsApi.batchDelete(selectedQuestions);
      toast({
        title: "批量删除成功",
        description: `已成功删除 ${selectedQuestions.length} 道题目`,
      });
      setSelectedQuestions([]);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "批量删除失败",
        description: error.message || "批量删除题目失败",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({
        title: "文件格式错误",
        description: "仅支持 CSV 或 TXT 文件",
        variant: "destructive",
      });
      return;
    }

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "文件大小不能超过 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await questionsApi.importFile(file);
      const result = response.data;
      
      toast({
        title: "导入完成",
        description: `成功导入 ${result.importResult.successCount} 道题目，失败 ${result.importResult.failedCount} 道`,
      });

      // 如果有导入报告，显示详情
      if (result.report) {
        console.log('导入报告:', result.report);
      }

      loadQuestions();
    } catch (error: any) {
      toast({
        title: "导入失败",
        description: error.message || "导入题目失败",
        variant: "destructive",
      });
    }

    // 清空文件输入
    event.target.value = '';
  };

  const toggleSelectQuestion = (id: number) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(qid => qid !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
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
    switch (type) {
      case 'programming': return '编程题';
      case 'qa': return '问答题';
      case 'behavioral': return '行为面试';
      case 'technical_qa': return '技术问答';
      default: return type;
    }
  };

  const downloadTemplate = () => {
    const csvContent = `题干,答案,标签,类型,难度
请描述一次团队合作的经历,详细说明你在团队中的角色、遇到的挑战以及最终结果,行为面试|团队协作,behavioral,medium
谈谈你对微服务架构的理解,开放性问题,技术问答|架构设计,technical_qa,hard`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '题库导入模板.csv';
    link.click();
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">题库管理</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理面试题目，支持批量导入和分类管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/questions/tags')}>
            <Tag className="mr-2 h-4 w-4" />
            标签管理
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            下载模板
          </Button>
          <label htmlFor="file-upload">
            <Button variant="outline" as Component="span">
              <Upload className="mr-2 h-4 w-4" />
              导入题目
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <Button onClick={() => router.push('/admin/questions/create')}>
            <Plus className="mr-2 h-4 w-4" />
            新建题目
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索题目标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>搜索</Button>
            </div>

            {/* 筛选条件 */}
            <div className="flex flex-wrap gap-4">
              {/* 类型筛选 */}
              <div className="flex gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 self-center">类型：</span>
                <Button
                  variant={typeFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('')}
                >
                  全部
                </Button>
                <Button
                  variant={typeFilter === 'programming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('programming')}
                >
                  编程题
                </Button>
                <Button
                  variant={typeFilter === 'qa' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('qa')}
                >
                  问答题
                </Button>
                <Button
                  variant={typeFilter === 'behavioral' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('behavioral')}
                >
                  行为面试
                </Button>
                <Button
                  variant={typeFilter === 'technical_qa' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter('technical_qa')}
                >
                  技术问答
                </Button>
              </div>

              {/* 难度筛选 */}
              <div className="flex gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 self-center">难度：</span>
                <Button
                  variant={difficultyFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFilter('')}
                >
                  全部
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

            {/* 标签筛选 */}
            {tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">标签筛选：</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 10).map(tag => (
                    <Button
                      key={tag.id}
                      variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (selectedTags.includes(tag.name)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag.name));
                        } else {
                          setSelectedTags([...selectedTags, tag.name]);
                        }
                      }}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.name) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 批量操作栏 */}
      {selectedQuestions.length > 0 && (
        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                已选择 {selectedQuestions.length} 道题目
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedQuestions([])}>
                  取消选择
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  批量删除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 题目列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>题目列表（共 {total} 道）</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
              {selectedQuestions.length === questions.length ? '取消全选' : '全选'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">暂无题目</p>
              <p className="text-sm">点击"新建题目"或"导入题目"开始添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    selectedQuestions.includes(question.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : ''
                  }`}
                >
                  {/* 复选框 */}
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.id)}
                    onChange={() => toggleSelectQuestion(question.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />

                  {/* 题目信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{question.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyLabel(question.difficulty)}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800">
                        {getTypeLabel(question.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {question.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {question.tags && question.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {question.creator && (
                        <span className="text-xs text-gray-500">
                          创建者: {question.creator.username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/questions/${question.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span className="px-4 py-2 text-sm">
                第 {page} 页，共 {Math.ceil(total / 20)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

