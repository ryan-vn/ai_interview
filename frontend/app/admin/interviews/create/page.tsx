'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Mail, Phone, Briefcase, Users } from 'lucide-react';
import { format } from 'date-fns';
import { interviewsApi } from '@/lib/api';

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

export default function CreateInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  
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
      const response = await fetch('/api/users?role=interviewer');
      const data = await response.json();
      setInterviewers(data);
    } catch (error) {
      console.error('获取面试官失败:', error);
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

      alert('面试场次创建成功！候选人将收到邮件通知。');
      router.push('/admin/interviews');
    } catch (error: any) {
      alert(error.response?.data?.message || '创建失败，请重试');
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
      </div>
    </div>
  );
}
