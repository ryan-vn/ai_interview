'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Mail, Phone, Briefcase } from 'lucide-react';
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
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchSessionInfo();
  }, [token]);

  const fetchSessionInfo = async () => {
    try {
      const response = await interviewsApi.getSessionByInvite(token);
      setSession(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '面试邀请链接无效或已过期');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinInterview = async () => {
    setJoining(true);
    try {
      // 将 token 保存到 sessionStorage，用于后续 API 调用
      sessionStorage.setItem('invite_token', token);
      sessionStorage.setItem('session_id', String(session?.id));
      
      // 直接跳转到面试页面（复用现有页面）
      router.push(`/interviews/${session?.id}`);
    } catch (err: any) {
      setError(err.message || '加入面试失败');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载面试信息中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">邀请链接无效</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/')} variant="outline">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  const isExpired = new Date() > new Date(session.inviteExpiresAt);
  const isUpcoming = new Date() < new Date(session.scheduledAt);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              面试邀请
            </CardTitle>
            <p className="text-gray-600 mt-2">
              您收到了一个面试邀请，请查看详细信息
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 面试基本信息 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg text-blue-900 mb-3">
                {session.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    {format(new Date(session.scheduledAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    预计时长 {session.template.duration} 分钟
                  </span>
                </div>
              </div>
            </div>

            {/* 候选人信息确认 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">候选人信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{session.candidateName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{session.candidateEmail}</span>
                </div>
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

            {/* 面试模板信息 */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">面试模板</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900">{session.template.name}</h5>
                <p className="text-sm text-gray-600 mt-1">{session.template.description}</p>
              </div>
            </div>

            {/* 面试官信息 */}
            {session.interviewer && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">面试官</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {session.interviewer.username} ({session.interviewer.email})
                  </p>
                </div>
              </div>
            )}

            {/* 状态提示 */}
            <div className="text-center">
              {isExpired ? (
                <Badge variant="destructive" className="text-sm">
                  邀请链接已过期
                </Badge>
              ) : isUpcoming ? (
                <Badge variant="secondary" className="text-sm">
                  面试尚未开始
                </Badge>
              ) : (
                <Badge variant="default" className="text-sm">
                  可以开始面试
                </Badge>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              {!isExpired && (
                <Button
                  onClick={handleJoinInterview}
                  disabled={joining}
                  className="px-8"
                >
                  {joining ? '加入中...' : '加入面试'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/')}
              >
                返回首页
              </Button>
            </div>

            {/* 提示信息 */}
            <div className="text-center text-sm text-gray-500">
              <p>点击"加入面试"即可直接开始面试，无需注册或登录</p>
              <p>面试链接有效期至：{format(new Date(session.inviteExpiresAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
