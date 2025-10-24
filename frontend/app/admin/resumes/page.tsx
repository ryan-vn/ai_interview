'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface Resume {
  id: number;
  name: string;
  phone: string;
  email: string;
  skills: string[];
  status: string;
  job?: {
    id: number;
    title: string;
  };
  yearsOfExperience?: number;
  createdAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async (searchKeyword?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      const response = await api.get('/resumes', { params });
      setResumes(response.data.data || []);
    } catch (error) {
      console.error('加载简历失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadResumes(keyword);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('简历上传成功！系统正在解析...');
      loadResumes();
    } catch (error) {
      console.error('上传简历失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该简历吗？')) return;
    try {
      await api.delete(`/resumes/${id}`);
      loadResumes();
    } catch (error) {
      console.error('删除简历失败:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      new: '新简历',
      screening: '筛选中',
      interview: '面试中',
      offer: '已发Offer',
      rejected: '已淘汰',
      hired: '已入职',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      new: 'default',
      screening: 'secondary',
      interview: 'default',
      offer: 'default',
      rejected: 'secondary',
      hired: 'default',
    };
    return colorMap[status] || 'outline';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">简历管理</h1>
        <div className="flex gap-2">
          <label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.json"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              style={{ display: 'none' }}
            />
            <Button as="span" disabled={uploadingFile}>
              {uploadingFile ? '上传中...' : '导入简历'}
            </Button>
          </label>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin/resumes/create')}
          >
            手动录入
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="搜索姓名、手机号、邮箱..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </Card>

      <div className="grid gap-4">
        {resumes.map((resume) => (
          <Card key={resume.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{resume.name}</h3>
                  <Badge variant={getStatusColor(resume.status)}>
                    {getStatusLabel(resume.status)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p>📱 {resume.phone}</p>
                  <p>📧 {resume.email}</p>
                  {resume.yearsOfExperience !== undefined && (
                    <p>💼 工作经验: {resume.yearsOfExperience}年</p>
                  )}
                  {resume.job && (
                    <p>🎯 应聘岗位: {resume.job.title}</p>
                  )}
                </div>
                {resume.skills && resume.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/admin/resumes/${resume.id}`)
                  }
                >
                  查看详情
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/admin/resumes/${resume.id}/match`)
                  }
                >
                  匹配岗位
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(resume.id)}
                >
                  删除
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {resumes.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">暂无简历，点击"导入简历"开始添加</p>
        </Card>
      )}
    </div>
  );
}

