'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Mail, Phone, Briefcase, Users, Copy, ExternalLink, CheckCircle, Link, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { interviewsApi, usersApi, resumesApi } from '@/lib/api';

interface Template {
  id: number;
  name: string;
  description: string;
  duration: number;
  passingScore: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface Resume {
  id: number;
  name: string;
  phone: string;
  email: string;
  jobId?: number;
  status: string;
  createdAt: string;
  job?: {
    id: number;
    title: string;
  };
}

export default function CreateInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [createdSession, setCreatedSession] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [formData, setFormData] = useState({
    // 基本信息
    name: '',
    templateId: '',
    interviewerId: '',
    scheduledAt: '',
    
    // 候选人信息
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    position: '',
    
    // 面试设置
    duration: '',
    allowReschedule: true,
    reminderEnabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
    fetchInterviewers();
    fetchRecentResumes();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await interviewsApi.getTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('获取模板失败:', error);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const response = await usersApi.getAll({ role: 'interviewer' });
      console.log('Interviewers API response:', response.data);
      
      // Handle the response structure - data might be directly an array or nested
      const interviewersData = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data?.data) ? response.data.data : []);
      
      setInterviewers(interviewersData);
    } catch (error) {
      console.error('获取面试官失败:', error);
      setInterviewers([]); // Ensure it's always an array
    }
  };

  const fetchRecentResumes = async () => {
    try {
      const response = await resumesApi.getAll({ page: 1, limit: 20 });
      console.log('Resumes API response:', response.data);
      
      // Handle the response structure
      const resumesData = response.data?.data || response.data || [];
      setResumes(Array.isArray(resumesData) ? resumesData : []);
    } catch (error) {
      console.error('获取简历列表失败:', error);
      setResumes([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '面试名称不能为空';
    }

    if (!formData.templateId) {
      newErrors.templateId = '请选择面试模板';
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = '请选择面试时间';
    } else if (new Date(formData.scheduledAt) <= new Date()) {
      newErrors.scheduledAt = '面试时间必须是未来时间';
    }

    if (!formData.candidateName.trim()) {
      newErrors.candidateName = '候选人姓名不能为空';
    }

    if (!formData.candidateEmail.trim()) {
      newErrors.candidateEmail = '候选人邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.candidateEmail)) {
      newErrors.candidateEmail = '请输入有效的邮箱地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await interviewsApi.createSession({
        name: formData.name,
        templateId: parseInt(formData.templateId),
        interviewerId: formData.interviewerId ? parseInt(formData.interviewerId) : undefined,
        scheduledAt: formData.scheduledAt,
        candidateInfo: {
          name: formData.candidateName,
          email: formData.candidateEmail,
          phone: formData.candidatePhone || undefined,
          position: formData.position || undefined,
        },
        settings: {
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          allowReschedule: formData.allowReschedule,
          reminderEnabled: formData.reminderEnabled,
        },
      });

      setCreatedSession(response.data);
      setShowSuccess(true);
    } catch (error: any) {
      alert(error.message || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleResumeSelect = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    
    if (!resumeId) {
      // 清空选择
      return;
    }
    
    const resume = resumes.find(r => r.id === parseInt(resumeId));
    if (resume) {
      setFormData(prev => ({
        ...prev,
        candidateName: resume.name,
        candidateEmail: resume.email,
        candidatePhone: resume.phone,
        position: resume.job?.title || '',
      }));
      
      // 清除相关字段的错误
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.candidateName;
        delete newErrors.candidateEmail;
        delete newErrors.candidatePhone;
        return newErrors;
      });
    }
  };

  const copyInviteLink = async () => {
    if (createdSession?.inviteToken) {
      const inviteLink = `${window.location.origin}/invite/${createdSession.inviteToken}`;
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      templateId: '',
      interviewerId: '',
      scheduledAt: '',
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      position: '',
      duration: '',
      allowReschedule: true,
      reminderEnabled: true,
    });
    setCreatedSession(null);
    setShowSuccess(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              创建面试场次
            </CardTitle>
            <p className="text-gray-600">
              填写面试信息，系统将自动发送邀请邮件给候选人
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 基本信息 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  基本信息
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">面试名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="例如：前端工程师面试"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="templateId">面试模板 *</Label>
                    <select
                      id="templateId"
                      value={formData.templateId}
                      onChange={(e) => handleInputChange('templateId', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${errors.templateId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">请选择模板</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.duration}分钟)
                        </option>
                      ))}
                    </select>
                    {errors.templateId && <p className="text-red-500 text-sm mt-1">{errors.templateId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="interviewerId">面试官</Label>
                    <select
                      id="interviewerId"
                      value={formData.interviewerId}
                      onChange={(e) => handleInputChange('interviewerId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">请选择面试官（可选）</option>
                      {interviewers.map(interviewer => (
                        <option key={interviewer.id} value={interviewer.id}>
                          {interviewer.username} ({interviewer.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="scheduledAt">面试时间 *</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      className={errors.scheduledAt ? 'border-red-500' : ''}
                    />
                    {errors.scheduledAt && <p className="text-red-500 text-sm mt-1">{errors.scheduledAt}</p>}
                  </div>
                </div>
              </div>

              {/* 候选人信息 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  候选人信息
                </h3>
                
                {/* 简历选择器 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <Label className="text-blue-900 font-medium">从最新简历中选择</Label>
                  </div>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => handleResumeSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md bg-white"
                  >
                    <option value="">手动输入候选人信息</option>
                    {resumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.name} - {resume.phone} 
                        {resume.job?.title ? ` - ${resume.job.title}` : ''}
                        {' '}(导入于: {new Date(resume.createdAt).toLocaleString('zh-CN')})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-blue-700 mt-2">
                    💡 选择简历后会自动填充候选人信息和岗位
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="candidateName">候选人姓名 *</Label>
                    <Input
                      id="candidateName"
                      value={formData.candidateName}
                      onChange={(e) => handleInputChange('candidateName', e.target.value)}
                      placeholder="请输入候选人姓名"
                      className={errors.candidateName ? 'border-red-500' : ''}
                    />
                    {errors.candidateName && <p className="text-red-500 text-sm mt-1">{errors.candidateName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="candidateEmail">候选人邮箱 *</Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      value={formData.candidateEmail}
                      onChange={(e) => handleInputChange('candidateEmail', e.target.value)}
                      placeholder="candidate@example.com"
                      className={errors.candidateEmail ? 'border-red-500' : ''}
                    />
                    {errors.candidateEmail && <p className="text-red-500 text-sm mt-1">{errors.candidateEmail}</p>}
                  </div>

                  <div>
                    <Label htmlFor="candidatePhone">候选人手机号</Label>
                    <Input
                      id="candidatePhone"
                      value={formData.candidatePhone}
                      onChange={(e) => handleInputChange('candidatePhone', e.target.value)}
                      placeholder="13800138000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="position">应聘职位</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="前端开发工程师"
                    />
                  </div>
                </div>
              </div>

              {/* 面试设置 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  面试设置
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="duration">面试时长（分钟）</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="120"
                    />
                    <p className="text-sm text-gray-500 mt-1">留空则使用模板默认时长</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowReschedule"
                        checked={formData.allowReschedule}
                        onChange={(e) => handleInputChange('allowReschedule', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="allowReschedule">允许候选人重新安排时间</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="reminderEnabled"
                        checked={formData.reminderEnabled}
                        onChange={(e) => handleInputChange('reminderEnabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="reminderEnabled">发送提醒邮件</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-8"
                >
                  {loading ? '创建中...' : '创建面试场次'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 成功创建后的邀请链接显示 */}
        {showSuccess && createdSession && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <CheckCircle className="h-6 w-6 mr-2" />
                面试场次创建成功！
              </CardTitle>
              <p className="text-green-700">
                系统已自动生成邀请链接并发送邮件通知候选人
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 面试信息 */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">面试信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>面试名称：</strong>{createdSession.name}</p>
                    <p><strong>候选人：</strong>{createdSession.candidateName}</p>
                    <p><strong>邮箱：</strong>{createdSession.candidateEmail}</p>
                  </div>
                  <div>
                    <p><strong>面试时间：</strong>{format(new Date(createdSession.scheduledAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
                    <p><strong>邀请过期：</strong>{format(new Date(createdSession.inviteExpiresAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
                    <p><strong>面试ID：</strong>{createdSession.id}</p>
                  </div>
                </div>
              </div>

              {/* 邀请链接 */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Link className="h-5 w-5 mr-2" />
                  面试邀请链接
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={`${window.location.origin}/invite/${createdSession.inviteToken}`}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      onClick={copyInviteLink}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>复制</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => window.open(`/invite/${createdSession.inviteToken}`, '_blank')}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>预览邀请页面</span>
                  </Button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <p>✅ 邀请邮件已发送给候选人</p>
                  <p>✅ 邀请链接已生成，有效期7天</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                  >
                    创建新面试
                  </Button>
                  <Button
                    onClick={() => router.push('/admin/interviews')}
                  >
                    查看所有面试
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
