'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Job {
  id: number;
  title: string;
  department: string;
  responsibilities: string;
  requirements: string;
  skillKeywords: string[];
  hiringCount: number;
  educationRequirement: string;
  experienceRequirement: string;
  salaryRange: string;
  location: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    responsibilities: '',
    requirements: '',
    skillKeywords: '',
    hiringCount: '',
    educationRequirement: '',
    experienceRequirement: '',
    salaryRange: '',
    location: '',
    status: 'open' as 'open' | 'closed',
  });

  useEffect(() => {
    loadJob();
  }, []);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${params.id}`);
      const jobData = response.data;
      setJob(jobData);
      setFormData({
        title: jobData.title || '',
        department: jobData.department || '',
        responsibilities: jobData.responsibilities || '',
        requirements: jobData.requirements || '',
        skillKeywords: jobData.skillKeywords?.join(', ') || '',
        hiringCount: jobData.hiringCount?.toString() || '',
        educationRequirement: jobData.educationRequirement || '',
        experienceRequirement: jobData.experienceRequirement || '',
        salaryRange: jobData.salaryRange || '',
        location: jobData.location || '',
        status: jobData.status || 'open',
      });
    } catch (error: any) {
      console.error('加载岗位失败:', error);
      alert(error.message || '加载岗位失败');
      router.push('/admin/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('请输入岗位名称');
      return;
    }
    if (!formData.department.trim()) {
      alert('请输入所属部门');
      return;
    }
    if (!formData.responsibilities.trim()) {
      alert('请输入岗位职责');
      return;
    }
    if (!formData.requirements.trim()) {
      alert('请输入技能要求');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        skillKeywords: formData.skillKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        hiringCount: formData.hiringCount ? parseInt(formData.hiringCount) : undefined,
      };
      await api.patch(`/jobs/${params.id}`, payload);
      alert('保存成功');
      router.push('/admin/jobs');
    } catch (error: any) {
      console.error('保存岗位失败:', error);
      alert(error.message || '保存岗位失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = formData.status === 'open' ? 'closed' : 'open';
    setFormData({ ...formData, status: newStatus });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">岗位不存在</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">编辑岗位</h1>
        <div className="flex gap-2">
          <Badge variant={formData.status === 'open' ? 'default' : 'secondary'}>
            {formData.status === 'open' ? '招聘中' : '已关闭'}
          </Badge>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">岗位名称 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="department">所属部门 *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                required
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">工作地点</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                maxLength={100}
                placeholder="例如: 北京"
              />
            </div>
            <div>
              <Label htmlFor="hiringCount">招聘人数</Label>
              <Input
                id="hiringCount"
                type="number"
                min="1"
                value={formData.hiringCount}
                onChange={(e) =>
                  setFormData({ ...formData, hiringCount: e.target.value })
                }
                placeholder="不填表示不限"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="educationRequirement">学历要求</Label>
              <Input
                id="educationRequirement"
                value={formData.educationRequirement}
                onChange={(e) =>
                  setFormData({ ...formData, educationRequirement: e.target.value })
                }
                maxLength={50}
                placeholder="例如: 本科及以上"
              />
            </div>
            <div>
              <Label htmlFor="experienceRequirement">工作年限</Label>
              <Input
                id="experienceRequirement"
                value={formData.experienceRequirement}
                onChange={(e) =>
                  setFormData({ ...formData, experienceRequirement: e.target.value })
                }
                maxLength={50}
                placeholder="例如: 3-5年"
              />
            </div>
            <div>
              <Label htmlFor="salaryRange">薪资范围</Label>
              <Input
                id="salaryRange"
                value={formData.salaryRange}
                onChange={(e) =>
                  setFormData({ ...formData, salaryRange: e.target.value })
                }
                maxLength={50}
                placeholder="例如: 20k-35k"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="responsibilities">岗位职责 *</Label>
            <textarea
              id="responsibilities"
              className="w-full min-h-[120px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.responsibilities}
              onChange={(e) =>
                setFormData({ ...formData, responsibilities: e.target.value })
              }
              required
              placeholder="请详细描述岗位职责..."
            />
          </div>

          <div>
            <Label htmlFor="requirements">任职要求 *</Label>
            <textarea
              id="requirements"
              className="w-full min-h-[120px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              required
              placeholder="请详细描述任职要求..."
            />
          </div>

          <div>
            <Label htmlFor="skillKeywords">
              技能关键词 (逗号分隔，用于简历匹配)
            </Label>
            <Input
              id="skillKeywords"
              value={formData.skillKeywords}
              onChange={(e) =>
                setFormData({ ...formData, skillKeywords: e.target.value })
              }
              placeholder="例如: React, TypeScript, Node.js, 前端工程化"
            />
            <p className="text-sm text-gray-500 mt-1">
              这些关键词将用于计算简历与岗位的匹配度
            </p>
          </div>

          <div>
            <Label htmlFor="status">岗位状态</Label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="open"
                  checked={formData.status === 'open'}
                  onChange={() => setFormData({ ...formData, status: 'open' })}
                />
                <span>开放招聘</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="closed"
                  checked={formData.status === 'closed'}
                  onChange={() => setFormData({ ...formData, status: 'closed' })}
                />
                <span>已关闭</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存修改'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 text-sm text-gray-500">
        创建时间: {new Date(job.createdAt).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}

