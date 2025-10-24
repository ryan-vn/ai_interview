'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {api} from '@/lib/api';

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

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  
  // 搜索和筛选
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  
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
    loadJobs();
    loadDepartments();
  }, [page, statusFilter, departmentFilter]);

  const loadDepartments = async () => {
    try {
      const response = await api.get('/jobs/departments');
      setDepartments(response.data || []);
    } catch (error) {
      console.error('加载部门列表失败:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
      };
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (keyword) params.keyword = keyword;

      const response = await api.get('/jobs', { params });
      setJobs(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('加载岗位失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadJobs();
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setDepartmentFilter('');
    setPage(1);
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
      const payload = {
        ...formData,
        skillKeywords: formData.skillKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        hiringCount: formData.hiringCount ? parseInt(formData.hiringCount) : undefined,
      };
      await api.post('/jobs', payload);
      alert('创建成功');
      setShowForm(false);
      setFormData({
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
        status: 'open',
      });
      loadJobs();
      loadDepartments();
    } catch (error: any) {
      console.error('创建岗位失败:', error);
      alert(error.message || '创建岗位失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该岗位吗？')) return;
    try {
      await api.delete(`/jobs/${id}`);
      alert('删除成功');
      loadJobs();
    } catch (error: any) {
      console.error('删除岗位失败:', error);
      alert(error.message || '删除岗位失败');
    }
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await api.patch(`/jobs/${job.id}`, { status: newStatus });
      alert(`岗位已${newStatus === 'open' ? '开放' : '关闭'}`);
      loadJobs();
    } catch (error: any) {
      console.error('修改状态失败:', error);
      alert(error.message || '修改状态失败');
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">岗位管理</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新建岗位'}
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>搜索关键词</Label>
            <Input
              placeholder="岗位名称、职责、要求"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <Label>岗位状态</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部</option>
              <option value="open">招聘中</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div>
            <Label>所属部门</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">全部</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleSearch}>搜索</Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          共找到 {total} 个岗位
        </div>
      </Card>

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">新建岗位</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.responsibilities}
                onChange={(e) =>
                  setFormData({ ...formData, responsibilities: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="requirements">任职要求 *</Label>
              <textarea
                id="requirements"
                className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                required
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
                placeholder="例如: React, TypeScript, Node.js"
              />
            </div>
            <div>
              <Label>岗位状态</Label>
              <div className="flex gap-4 mt-2">
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
            <div className="flex gap-4">
              <Button type="submit">创建</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                取消
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{job.title}</h3>
                  <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                    {job.status === 'open' ? '招聘中' : '已关闭'}
                  </Badge>
                </div>
                
                <div className="space-y-1 mb-3">
                  <p className="text-gray-600">
                    <span className="font-medium">部门：</span>{job.department}
                    {job.location && ` · ${job.location}`}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    {job.hiringCount && (
                      <span>招聘 {job.hiringCount} 人</span>
                    )}
                    {job.educationRequirement && (
                      <span>{job.educationRequirement}</span>
                    )}
                    {job.experienceRequirement && (
                      <span>{job.experienceRequirement}</span>
                    )}
                    {job.salaryRange && (
                      <span>{job.salaryRange}</span>
                    )}
                  </div>
                </div>

                {job.skillKeywords && job.skillKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.skillKeywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    查看详情
                  </summary>
                  <div className="mt-3 space-y-3 text-sm pl-4 border-l-2 border-gray-200">
                    <div>
                      <strong className="text-gray-700">岗位职责：</strong>
                      <p className="whitespace-pre-wrap text-gray-600 mt-1">
                        {job.responsibilities}
                      </p>
                    </div>
                    <div>
                      <strong className="text-gray-700">任职要求：</strong>
                      <p className="whitespace-pre-wrap text-gray-600 mt-1">
                        {job.requirements}
                      </p>
                    </div>
                  </div>
                </details>

                <div className="text-xs text-gray-400 mt-3">
                  创建时间: {new Date(job.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/jobs/${job.id}`)}
                >
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleJobStatus(job)}
                  className={job.status === 'open' ? 'text-orange-600' : 'text-green-600'}
                >
                  {job.status === 'open' ? '关闭' : '开放'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(job.id)}
                  className="text-red-600"
                >
                  删除
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-2">
            {keyword || statusFilter || departmentFilter
              ? '没有找到符合条件的岗位'
              : '暂无岗位'}
          </p>
          {!keyword && !statusFilter && !departmentFilter && (
            <Button onClick={() => setShowForm(true)} className="mt-4">
              新建第一个岗位
            </Button>
          )}
        </Card>
      )}

      {/* 分页 */}
      {total > 10 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="flex items-center px-4">
            第 {page} 页 / 共 {Math.ceil(total / 10)} 页
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 10)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}

