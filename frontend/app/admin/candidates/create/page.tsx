'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserPlus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateCandidatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    resume: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 验证必填字段
      if (!formData.name || !formData.email) {
        toast({
          title: '错误',
          description: '请填写姓名和邮箱',
          variant: 'destructive',
        });
        return;
      }

      // TODO: 调用API保存候选人信息
      // 目前暂存到本地存储作为候选人池
      const candidatesPool = JSON.parse(localStorage.getItem('candidatesPool') || '[]');
      const newCandidate = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      candidatesPool.push(newCandidate);
      localStorage.setItem('candidatesPool', JSON.stringify(candidatesPool));

      toast({
        title: '成功',
        description: '候选人信息已保存',
      });

      router.push('/admin/candidates');
    } catch (error) {
      console.error('Failed to create candidate:', error);
      toast({
        title: '错误',
        description: '保存失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        {/* 表单卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <UserPlus className="h-6 w-6 mr-2 text-blue-600" />
              录入候选人信息
            </CardTitle>
            <CardDescription>
              填写候选人基本信息，后续可在创建面试时选择候选人
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  基本信息
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="required">
                      姓名 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入候选人姓名"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="required">
                      邮箱 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="candidate@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="138xxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">应聘职位</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="例如：前端开发工程师"
                    />
                  </div>
                </div>
              </div>

              {/* 附加信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  附加信息（选填）
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="resume">简历链接或摘要</Label>
                  <textarea
                    id="resume"
                    value={formData.resume}
                    onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                    placeholder="可以粘贴简历链接或关键信息..."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="其他备注信息..."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading} className="min-w-[120px]">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      保存中...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 温馨提示</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>候选人信息保存后，可在创建面试时快速选择</li>
            <li>邮箱将作为候选人的唯一标识，请确保准确无误</li>
            <li>建议在附加信息中记录候选人的关键技能和经验</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

