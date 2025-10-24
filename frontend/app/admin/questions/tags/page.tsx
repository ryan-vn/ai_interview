"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tagsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Tag, X, Save } from "lucide-react";

interface QuestionTag {
  id: number;
  name: string;
  category: string;
  color?: string;
  description?: string;
  parentId?: number;
  parent?: QuestionTag;
  createdAt?: string;
  creator?: {
    username: string;
  };
}

export default function TagsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<QuestionTag | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'technical' as 'technical' | 'behavioral' | 'management' | 'other',
    color: '#3B82F6',
    description: '',
    parentId: 0,
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await tagsApi.getAll();
      setTags(response.data || []);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message || "加载标签列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "验证失败",
        description: "标签名称不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      const data: any = {
        name: formData.name,
        category: formData.category,
        color: formData.color,
        description: formData.description,
      };

      if (formData.parentId) {
        data.parentId = formData.parentId;
      }

      await tagsApi.create(data);
      toast({
        title: "创建成功",
        description: "标签已成功创建",
      });
      setShowCreateDialog(false);
      resetForm();
      loadTags();
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message || "创建标签失败",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !formData.name.trim()) return;

    try {
      const data: any = {
        name: formData.name,
        category: formData.category,
        color: formData.color,
        description: formData.description,
      };

      if (formData.parentId) {
        data.parentId = formData.parentId;
      }

      await tagsApi.update(editingTag.id, data);
      toast({
        title: "更新成功",
        description: "标签已成功更新",
      });
      setEditingTag(null);
      resetForm();
      loadTags();
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message || "更新标签失败",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除标签"${name}"吗？`)) return;

    try {
      await tagsApi.delete(id);
      toast({
        title: "删除成功",
        description: "标签已成功删除",
      });
      loadTags();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message || "删除标签失败",
        variant: "destructive",
      });
    }
  };

  const startEdit = (tag: QuestionTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      category: tag.category as any,
      color: tag.color || '#3B82F6',
      description: tag.description || '',
      parentId: tag.parentId || 0,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'technical',
      color: '#3B82F6',
      description: '',
      parentId: 0,
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return '技术类';
      case 'behavioral': return '行为类';
      case 'management': return '管理类';
      case 'other': return '其他';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'behavioral': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'management': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'other': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">标签管理</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理题目标签，支持分类和层级结构
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建标签
        </Button>
      </div>

      {/* 创建/编辑对话框 */}
      {(showCreateDialog || editingTag) && (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardHeader>
            <CardTitle>{editingTag ? '编辑标签' : '创建标签'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 标签名称 */}
              <div>
                <label htmlFor="tagName" className="block text-sm font-medium mb-2">
                  标签名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="tagName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入标签名称"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  分类 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'technical', label: '技术类' },
                    { value: 'behavioral', label: '行为类' },
                    { value: 'management', label: '管理类' },
                    { value: 'other', label: '其他' },
                  ].map(cat => (
                    <Button
                      key={cat.value}
                      type="button"
                      size="sm"
                      variant={formData.category === cat.value ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, category: cat.value as any })}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 颜色 */}
              <div>
                <label htmlFor="tagColor" className="block text-sm font-medium mb-2">
                  颜色
                </label>
                <div className="flex gap-2">
                  <Input
                    id="tagColor"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* 父标签 */}
              <div>
                <label htmlFor="parentTag" className="block text-sm font-medium mb-2">
                  父标签（可选）
                </label>
                <select
                  id="parentTag"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value={0}>无父标签</option>
                  {tags
                    .filter(t => !editingTag || t.id !== editingTag.id)
                    .map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label htmlFor="tagDescription" className="block text-sm font-medium mb-2">
                描述（可选）
              </label>
              <textarea
                id="tagDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入标签描述..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {editingTag ? (
                <Button onClick={handleUpdate}>
                  <Save className="mr-2 h-4 w-4" />
                  保存修改
                </Button>
              ) : (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建标签
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTag(null);
                  resetForm();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 标签列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Tag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">暂无标签</p>
                <p className="text-sm">点击"新建标签"开始添加</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                      />
                      <CardTitle className="text-lg">{tag.name}</CardTitle>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(tag.category)}`}>
                        {getCategoryLabel(tag.category)}
                      </span>
                      {tag.parent && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          父标签: {tag.parent.name}
                        </span>
                      )}
                    </div>
                    {tag.description && (
                      <CardDescription className="line-clamp-2 text-sm">
                        {tag.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {tag.creator && `创建者: ${tag.creator.username}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tag.id, tag.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

