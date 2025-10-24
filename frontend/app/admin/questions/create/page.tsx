"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    loadTags();
  }, []);

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
      setLoading(true);
      await questionsApi.create(formData);
      toast({
        title: "创建成功",
        description: "题目已成功创建",
      });
      router.push('/admin/questions');
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message || "创建题目失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tagName: string) => {
    if (formData.tags.includes(tagName)) {
      toast({
        title: "标签已存在",
        description: "该标签已添加",
        variant: "destructive",
      });
      return;
    }

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">创建题目</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            填写下方表单创建新的面试题目
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 主要表单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 题目类型 */}
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

                {/* 题目标题 */}
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

                {/* 题目描述 */}
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

                {/* 难度 */}
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

            {/* 标准答案和要点 */}
            <Card>
              <CardHeader>
                <CardTitle>答案信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 标准答案 */}
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

                {/* 答案要点 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    答案要点（可选，用于评分参考）
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

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 标签管理 */}
            <Card>
              <CardHeader>
                <CardTitle>标签（最多5个）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 已选标签 */}
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

                {/* 可用标签 */}
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

            {/* 高级设置（编程题） */}
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

            {/* 提交按钮 */}
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? '创建中...' : '创建题目'}
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

