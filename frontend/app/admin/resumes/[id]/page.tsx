'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  name: string;
  phone: string;
  email: string;
  gender?: string;
  age?: number;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    major?: string;
    startYear: number;
    endYear: number;
  }>;
  yearsOfExperience?: number;
  expectedSalary?: string;
  status: string;
  parseStatus: string;
  parseError?: string;
  fileName?: string;
  filePath?: string;
  notes?: string;
  job?: {
    id: number;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Resume>>({});

  useEffect(() => {
    loadResume();
  }, [resumeId]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/resumes/${resumeId}`);
      setResume(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('加载简历失败:', error);
      alert('简历不存在或已被删除');
      router.push('/admin/resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.patch(`/resumes/${resumeId}`, formData);
      alert('保存成功！');
      setEditing(false);
      loadResume();
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(error.message || '保存失败，请重试');
    }
  };

  const handleDownload = async () => {
    if (!resume?.filePath) {
      alert('该简历没有原始文件');
      return;
    }

    try {
      const response = await api.get(`/resumes/${resumeId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resume.fileName || `resume_${resumeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('下载失败:', error);
      alert('下载失败');
    }
  };

  const handleReparse = async () => {
    if (!confirm('确定要重新解析该简历吗？')) return;

    try {
      await api.post(`/resumes/${resumeId}/reparse`);
      alert('已开始重新解析，请稍后刷新查看结果');
      setTimeout(() => loadResume(), 3000);
    } catch (error: any) {
      console.error('重新解析失败:', error);
      alert(error.message || '重新解析失败');
    }
  };

  const addSkill = () => {
    const newSkills = [...(formData.skills || []), ''];
    setFormData({ ...formData, skills: newSkills });
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...(formData.skills || [])];
    newSkills[index] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const removeSkill = (index: number) => {
    const newSkills = formData.skills?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, skills: newSkills });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">简历不存在</div>
      </div>
    );
  }

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

  const getParseStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '解析中',
      success: '已解析',
      failed: '解析失败',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            ← 返回
          </Button>
          <h1 className="text-3xl font-bold">简历详情</h1>
        </div>
        <div className="flex gap-2">
          {resume.filePath && (
            <Button variant="outline" onClick={handleDownload}>
              📥 下载原件
            </Button>
          )}
          {resume.parseStatus === 'failed' && (
            <Button variant="outline" onClick={handleReparse}>
              🔄 重新解析
            </Button>
          )}
          {!editing ? (
            <Button onClick={() => setEditing(true)}>✏️ 编辑</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>💾 保存</Button>
            </>
          )}
        </div>
      </div>

      {/* 解析状态提示 */}
      {resume.parseStatus === 'failed' && resume.parseError && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-red-800 mb-1">解析失败</div>
              <div className="text-sm text-red-700">{resume.parseError}</div>
              {resume.parseError.includes('扫描件') && (
                <div className="mt-2 text-sm text-red-600">
                  💡 提示：您可以点击"下载原件"查看 PDF，然后手动编辑录入简历信息。
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {resume.parseStatus === 'pending' && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="animate-spin">⏳</span>
            <span>AI 正在解析简历，请稍后刷新查看结果...</span>
          </div>
        </Card>
      )}

      {/* 基本信息 */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">基本信息</h2>
          <div className="flex gap-2">
            <Badge>{getStatusLabel(resume.status)}</Badge>
            <Badge variant={resume.parseStatus === 'success' ? 'default' : 'destructive'}>
              {getParseStatusLabel(resume.parseStatus)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 *
            </label>
            {editing ? (
              <Input
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            ) : (
              <div className="text-lg">{resume.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              手机号 *
            </label>
            {editing ? (
              <Input
                value={formData.phone || ''}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            ) : (
              <div className="text-lg">{resume.phone}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 *
            </label>
            {editing ? (
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            ) : (
              <div className="text-lg">{resume.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性别
            </label>
            {editing ? (
              <Input
                value={formData.gender || ''}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                placeholder="男/女"
              />
            ) : (
              <div className="text-lg">{resume.gender || '-'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              年龄
            </label>
            {editing ? (
              <Input
                type="number"
                value={formData.age || ''}
                onChange={(e) =>
                  setFormData({ ...formData, age: parseInt(e.target.value) })
                }
              />
            ) : (
              <div className="text-lg">{resume.age || '-'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工作年限
            </label>
            {editing ? (
              <Input
                type="number"
                value={formData.yearsOfExperience || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearsOfExperience: parseInt(e.target.value),
                  })
                }
              />
            ) : (
              <div className="text-lg">
                {resume.yearsOfExperience ? `${resume.yearsOfExperience}年` : '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期望薪资
            </label>
            {editing ? (
              <Input
                value={formData.expectedSalary || ''}
                onChange={(e) =>
                  setFormData({ ...formData, expectedSalary: e.target.value })
                }
                placeholder="例如: 15k-20k"
              />
            ) : (
              <div className="text-lg">{resume.expectedSalary || '-'}</div>
            )}
          </div>

          {resume.job && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                应聘岗位
              </label>
              <div className="text-lg">{resume.job.title}</div>
            </div>
          )}
        </div>

        {resume.fileName && (
          <div className="mt-4 text-sm text-gray-500">
            📎 原始文件: {resume.fileName}
          </div>
        )}
      </Card>

      {/* 技能 */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">技能</h2>
          {editing && (
            <Button size="sm" onClick={addSkill}>
              + 添加技能
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            {(formData.skills || []).map((skill, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={skill}
                  onChange={(e) => updateSkill(index, e.target.value)}
                  placeholder="例如: Java"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSkill(index)}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {resume.skills && resume.skills.length > 0 ? (
              resume.skills.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))
            ) : (
              <div className="text-gray-500">暂无技能信息</div>
            )}
          </div>
        )}
      </Card>

      {/* 工作经历 */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">工作经历</h2>
        {resume.experience && resume.experience.length > 0 ? (
          <div className="space-y-4">
            {resume.experience.map((exp, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="font-semibold text-lg">{exp.company}</div>
                <div className="text-gray-700">{exp.title}</div>
                <div className="text-sm text-gray-500">
                  {exp.startDate} - {exp.endDate}
                </div>
                {exp.description && (
                  <div className="mt-2 text-gray-600">{exp.description}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">暂无工作经历</div>
        )}
      </Card>

      {/* 教育背景 */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">教育背景</h2>
        {resume.education && resume.education.length > 0 ? (
          <div className="space-y-4">
            {resume.education.map((edu, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <div className="font-semibold text-lg">{edu.school}</div>
                <div className="text-gray-700">
                  {edu.degree} {edu.major && `· ${edu.major}`}
                </div>
                <div className="text-sm text-gray-500">
                  {edu.startYear} - {edu.endYear}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">暂无教育背景</div>
        )}
      </Card>

      {/* 备注 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">备注</h2>
        {editing ? (
          <textarea
            className="w-full border rounded p-2 min-h-[100px]"
            value={formData.notes || ''}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="添加备注..."
          />
        ) : (
          <div className="text-gray-700">
            {resume.notes || <span className="text-gray-400">暂无备注</span>}
          </div>
        )}
      </Card>

      {/* 底部信息 */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        <div>创建时间: {new Date(resume.createdAt).toLocaleString()}</div>
        <div>更新时间: {new Date(resume.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}

