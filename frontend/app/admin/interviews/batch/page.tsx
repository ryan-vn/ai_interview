'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { interviewsApi } from '@/lib/api';

interface CandidateInfo {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

interface InterviewSession {
  name: string;
  templateId: number;
  interviewerId?: number;
  scheduledAt: string;
  candidateInfo: CandidateInfo;
  settings?: {
    duration?: number;
    allowReschedule?: boolean;
    reminderEnabled?: boolean;
  };
}

interface Template {
  id: number;
  name: string;
  description: string;
  duration: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function BatchCreateInterviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 默认面试设置
  const [defaultSettings, setDefaultSettings] = useState({
    templateId: '',
    interviewerId: '',
    duration: '',
    allowReschedule: true,
    reminderEnabled: true,
  });

  useEffect(() => {
    fetchTemplates();
    fetchInterviewers();
    // 添加一个默认的面试场次
    addNewSession();
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

  const addNewSession = () => {
    const newSession: InterviewSession = {
      name: '',
      templateId: parseInt(defaultSettings.templateId) || 0,
      interviewerId: defaultSettings.interviewerId ? parseInt(defaultSettings.interviewerId) : undefined,
      scheduledAt: '',
      candidateInfo: {
        name: '',
        email: '',
        phone: '',
        position: '',
      },
      settings: {
        duration: defaultSettings.duration ? parseInt(defaultSettings.duration) : undefined,
        allowReschedule: defaultSettings.allowReschedule,
        reminderEnabled: defaultSettings.reminderEnabled,
      },
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (index: number) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((_, i) => i !== index));
    }
  };

  const updateSession = (index: number, field: string, value: any) => {
    const updatedSessions = [...sessions];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedSessions[index][parent][child] = value;
    } else {
      updatedSessions[index][field] = value;
    }
    setSessions(updatedSessions);
  };

  const validateSessions = () => {
    const errors: string[] = [];
    
    sessions.forEach((session, index) => {
      if (!session.name.trim()) {
        errors.push(`第${index + 1}个面试：面试名称不能为空`);
      }
      if (!session.templateId) {
        errors.push(`第${index + 1}个面试：请选择面试模板`);
      }
      if (!session.scheduledAt) {
        errors.push(`第${index + 1}个面试：请选择面试时间`);
      }
      if (!session.candidateInfo.name.trim()) {
        errors.push(`第${index + 1}个面试：候选人姓名不能为空`);
      }
      if (!session.candidateInfo.email.trim()) {
        errors.push(`第${index + 1}个面试：候选人邮箱不能为空`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.candidateInfo.email)) {
        errors.push(`第${index + 1}个面试：候选人邮箱格式不正确`);
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateSessions();
    if (errors.length > 0) {
      alert('请修正以下错误：\n' + errors.join('\n'));
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      const response = await interviewsApi.createBatchSessions(sessions);
      setResults(response.data.results);
      setShowResults(true);
      
      if (response.data.failed === 0) {
        alert(`成功创建 ${response.data.created} 个面试场次！`);
        router.push('/admin/interviews');
      } else {
        alert(`创建完成：成功 ${response.data.created} 个，失败 ${response.data.failed} 个`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '批量创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "面试名称,候选人姓名,候选人邮箱,候选人手机号,应聘职位,面试时间\n" +
      "前端工程师面试,张三,zhangsan@example.com,13800138000,前端开发工程师,2024-01-01T10:00:00\n" +
      "后端工程师面试,李四,lisi@example.com,13900139000,后端开发工程师,2024-01-01T14:00:00";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '面试场次模板.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              批量创建面试场次
            </CardTitle>
            <p className="text-gray-600">
              一次性创建多个面试场次，系统将自动生成邀请链接并发送邮件
            </p>
          </CardHeader>
          
          <CardContent>
            {/* 默认设置 */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">默认设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultTemplate">默认模板</Label>
                  <select
                    id="defaultTemplate"
                    value={defaultSettings.templateId}
                    onChange={(e) => setDefaultSettings(prev => ({ ...prev, templateId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">请选择模板</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="defaultInterviewer">默认面试官</Label>
                  <select
                    id="defaultInterviewer"
                    value={defaultSettings.interviewerId}
                    onChange={(e) => setDefaultSettings(prev => ({ ...prev, interviewerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">请选择面试官</option>
                    {interviewers.map(interviewer => (
                      <option key={interviewer.id} value={interviewer.id}>
                        {interviewer.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="defaultDuration">默认时长（分钟）</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={defaultSettings.duration}
                    onChange={(e) => setDefaultSettings(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            {/* 批量创建表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {sessions.map((session, index) => (
                <Card key={index} className="border-2 border-dashed border-gray-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">面试场次 {index + 1}</h4>
                      {sessions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSession(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>面试名称 *</Label>
                        <Input
                          value={session.name}
                          onChange={(e) => updateSession(index, 'name', e.target.value)}
                          placeholder="例如：前端工程师面试"
                        />
                      </div>

                      <div>
                        <Label>面试时间 *</Label>
                        <Input
                          type="datetime-local"
                          value={session.scheduledAt}
                          onChange={(e) => updateSession(index, 'scheduledAt', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>面试模板 *</Label>
                        <select
                          value={session.templateId}
                          onChange={(e) => updateSession(index, 'templateId', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">请选择模板</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>面试官</Label>
                        <select
                          value={session.interviewerId || ''}
                          onChange={(e) => updateSession(index, 'interviewerId', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">请选择面试官</option>
                          {interviewers.map(interviewer => (
                            <option key={interviewer.id} value={interviewer.id}>
                              {interviewer.username}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>候选人姓名 *</Label>
                        <Input
                          value={session.candidateInfo.name}
                          onChange={(e) => updateSession(index, 'candidateInfo.name', e.target.value)}
                          placeholder="请输入候选人姓名"
                        />
                      </div>

                      <div>
                        <Label>候选人邮箱 *</Label>
                        <Input
                          type="email"
                          value={session.candidateInfo.email}
                          onChange={(e) => updateSession(index, 'candidateInfo.email', e.target.value)}
                          placeholder="candidate@example.com"
                        />
                      </div>

                      <div>
                        <Label>候选人手机号</Label>
                        <Input
                          value={session.candidateInfo.phone || ''}
                          onChange={(e) => updateSession(index, 'candidateInfo.phone', e.target.value)}
                          placeholder="13800138000"
                        />
                      </div>

                      <div>
                        <Label>应聘职位</Label>
                        <Input
                          value={session.candidateInfo.position || ''}
                          onChange={(e) => updateSession(index, 'candidateInfo.position', e.target.value)}
                          placeholder="前端开发工程师"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 操作按钮 */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addNewSession}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>添加面试场次</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>下载模板</span>
                  </Button>
                </div>

                <div className="flex space-x-4">
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
                    {loading ? '创建中...' : `批量创建 ${sessions.length} 个面试场次`}
                  </Button>
                </div>
              </div>
            </form>

            {/* 结果显示 */}
            {showResults && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">创建结果</h3>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                        {result.success 
                          ? `面试场次 "${result.session.name}" 创建成功`
                          : `面试场次 "${result.sessionData.name}" 创建失败: ${result.error}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
