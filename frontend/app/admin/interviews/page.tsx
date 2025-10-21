'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Plus, 
  Search, 
  Filter,
  Copy,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { interviewsApi } from '@/lib/api';

interface InterviewSession {
  id: number;
  name: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  position?: string;
  scheduledAt: string;
  inviteExpiresAt: string;
  status: string;
  inviteToken: string;
  template: {
    id: number;
    name: string;
    description: string;
    duration: number;
  };
  interviewer?: {
    id: number;
    username: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminInterviewsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [resendingInvite, setResendingInvite] = useState<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await interviewsApi.getSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleResendInvite = async (sessionId: number) => {
    setResendingInvite(sessionId);
    try {
      await interviewsApi.resendInvite(sessionId);
      alert('邀请邮件已重新发送');
    } catch (error) {
      console.error('Failed to resend invite:', error);
      alert('重新发送失败，请重试');
    } finally {
      setResendingInvite(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { variant: 'secondary', text: '已安排' },
      in_progress: { variant: 'default', text: '进行中' },
      completed: { variant: 'outline', text: '已完成' },
      cancelled: { variant: 'destructive', text: '已取消' },
    };
    const config = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge variant={config.variant as any}>{config.text}</Badge>;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载面试场次中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题和操作 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">面试管理</h1>
              <p className="text-gray-600 mt-2">管理所有面试场次和邀请链接</p>
            </div>
            <Button 
              onClick={() => router.push('/admin/interviews/create')}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>创建面试</span>
            </Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索面试名称、候选人姓名或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">所有状态</option>
                  <option value="scheduled">已安排</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 面试场次列表 */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无面试场次</h3>
                  <p className="text-gray-600 mb-4">开始创建您的第一个面试场次</p>
                  <Button onClick={() => router.push('/admin/interviews/create')}>
                    创建面试
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* 面试信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {session.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(session.scheduledAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {session.template.duration}分钟
                            </span>
                            {getStatusBadge(session.status)}
                          </div>
                        </div>
                      </div>

                      {/* 候选人信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{session.candidateName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{session.candidateEmail}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {session.candidatePhone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{session.candidatePhone}</span>
                            </div>
                          )}
                          {session.position && (
                            <div className="flex items-center space-x-2">
                              <Briefcase className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{session.position}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 面试模板和面试官 */}
                      <div className="text-sm text-gray-600">
                        <p>模板: {session.template.name}</p>
                        {session.interviewer && (
                          <p>面试官: {session.interviewer.username}</p>
                        )}
                        <p>创建时间: {format(new Date(session.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col space-y-2 lg:min-w-[200px]">
                      {/* 邀请链接 */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            value={`${window.location.origin}/invite/${session.inviteToken}`}
                            readOnly
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInviteLink(session.inviteToken)}
                            className="flex items-center space-x-1"
                          >
                            {copiedToken === session.inviteToken ? (
                              <span className="text-green-600">已复制</span>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>复制</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/invite/${session.inviteToken}`, '_blank')}
                          className="w-full flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>预览邀请页面</span>
                        </Button>
                      </div>

                      {/* 其他操作 */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/interviews/${session.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(session.id)}
                          disabled={resendingInvite === session.id}
                          className="flex-1"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {resendingInvite === session.id ? '发送中...' : '重发邀请'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 统计信息 */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessions.filter(s => s.status === 'scheduled').length}
                </div>
                <div className="text-sm text-gray-600">已安排</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sessions.filter(s => s.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">进行中</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {sessions.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sessions.filter(s => s.status === 'cancelled').length}
                </div>
                <div className="text-sm text-gray-600">已取消</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
