"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { questionsApi, tagsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, X } from "lucide-react";

interface QuestionTag {
  id: number;
  name: string;
  category: string;
  color?: string;
}

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = parseInt(params.id as string);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<QuestionTag[]>([]);
  
  const [formData, setFormData] = useState({
    type: 'qa' as 'programming' | 'qa' | 'behavioral' | 'technical_qa',
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    tags: [] as string[],
    standardAnswer: '',
    answerPoints: [] as string[],
    timeLimit: 60,
    memoryLimit: 256,
  });

  const [currentAnswerPoint, setCurrentAnswerPoint] = useState('');

  useEffect(() => {
    loadQuestion();
    loadTags();
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      const response = await questionsApi.getOne(questionId);
      const question = response.data;
      
      setFormData({
        type: question.type,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        tags: question.tags || [],
        standardAnswer: question.standardAnswer || '',
        answerPoints: question.answerPoints || [],
        timeLimit: question.timeLimit || 60,
        memoryLimit: question.memoryLimit || 256,
      });
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message || "加载题目失败",
        variant: "destructive",
      });
      router.push('/admin/questions');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagsApi.getAll();
      setAvailableTags(response.data || []);
    } catch (error) {
      console.error("加载标签失败:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.title.trim()) {
      toast({
        title: "验证失败",
        description: "题目标题不能为空",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "验证失败",
        description: "题目描述不能为空",
        variant: "destructive",
      });
      return;
    }

    if (formData.tags.length > 5) {
      toast({
        title: "验证失败",
        description: "标签数量不能超过5个",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await questionsApi.update(questionId, formData);
      toast({
        title: "更新成功",
        description: "题目已成功更新",
      });
      router.push('/admin/questions');
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message || "更新题目失败",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tagName: string) => {
    if (formData.tags.includes(tagName)) return;
    if (formData.tags.length >= 5) {
      toast({
        title: "标签已满",
        description: "最多只能添加5个标签",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, tagName],
    });
  };

  const removeTag = (tagName: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagName),
    });
  };

  const addAnswerPoint = () => {
    if (!currentAnswerPoint.trim()) return;

    setFormData({
      ...formData,
      answerPoints: [...formData.answerPoints, currentAnswerPoint.trim()],
    });
    setCurrentAnswerPoint('');
  };

  const removeAnswerPoint = (index: number) => {
    setFormData({
      ...formData,
      answerPoints: formData.answerPoints.filter((_, i) => i !== index),
    });
  };

  if (loading) {
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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">编辑题目</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            修改题目信息
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 主要表单 - 与创建页面相同的内容 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    题目类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 'programming', label: '编程题' },
                      { value: 'qa', label: '问答题' },
                      { value: 'behavioral', label: '行为面试' },
                      { value: 'technical_qa', label: '技术问答' },
                    ].map(type => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={formData.type === type.value ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, type: type.value as any })}
                        className="w-full"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    题目标题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入题目标题"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    题目描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请详细描述题目要求..."
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    难度 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'easy', label: '简单', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { value: 'medium', label: '中等', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                      { value: 'hard', label: '困难', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                    ].map(diff => (
                      <button
                        key={diff.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficulty: diff.value as any })}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          formData.difficulty === diff.value 
                            ? diff.color 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>答案信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="standardAnswer" className="block text-sm font-medium mb-2">
                    标准答案（用于问答题）
                  </label>
                  <textarea
                    id="standardAnswer"
                    value={formData.standardAnswer}
                    onChange={(e) => setFormData({ ...formData, standardAnswer: e.target.value })}
                    placeholder="请输入标准答案..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    答案要点
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentAnswerPoint}
                      onChange={(e) => setCurrentAnswerPoint(e.target.value)}
                      placeholder="输入答案要点后按回车添加"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAnswerPoint())}
                    />
                    <Button type="button" onClick={addAnswerPoint}>
                      添加
                    </Button>
                  </div>
                  {formData.answerPoints.length > 0 && (
                    <div className="space-y-2">
                      {formData.answerPoints.map((point, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="flex-1 text-sm">{index + 1}. {point}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnswerPoint(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 - 与创建页面相同的内容 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>标签（最多5个）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-4 border-b">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    点击添加标签：
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addTag(tag.name)}
                        disabled={formData.tags.includes(tag.name)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          formData.tags.includes(tag.name)
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {formData.type === 'programming' && (
              <Card>
                <CardHeader>
                  <CardTitle>高级设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="timeLimit" className="block text-sm font-medium mb-2">
                      时间限制（秒）
                    </label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                      min={1}
                    />
                  </div>
                  <div>
                    <label htmlFor="memoryLimit" className="block text-sm font-medium mb-2">
                      内存限制（MB）
                    </label>
                    <Input
                      id="memoryLimit"
                      type="number"
                      value={formData.memoryLimit}
                      onChange={(e) => setFormData({ ...formData, memoryLimit: parseInt(e.target.value) })}
                      min={1}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? '保存中...' : '保存修改'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

