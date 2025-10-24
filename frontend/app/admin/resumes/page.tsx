'use client';

import { useState, useEffect, useRef } from 'react';
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
  skills: string[];
  status: string;
  parseStatus: 'pending' | 'success' | 'failed';
  parseError?: string;
  fileName?: string;
  filePath?: string;
  job?: {
    id: number;
    title: string;
  };
  yearsOfExperience?: number;
  createdAt: string;
}

interface ImportReport {
  totalImported: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResumes();
    loadImportReport();
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

  const loadImportReport = async () => {
    try {
      const response = await api.get('/resumes/import-report/me');
      setImportReport(response.data || null);
    } catch (error) {
      console.error('加载导入报告失败:', error);
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
      loadImportReport();
    } catch (error: any) {
      console.error('上传简历失败:', error);
      alert(error.message || '上传失败，请重试');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 100) {
      alert('单次最多上传100份简历');
      return;
    }

    try {
      setUploadingFile(true);
      setUploadProgress({ total: files.length, success: 0, failed: 0 });

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/resumes/batch-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      setUploadProgress({
        total: result.total,
        success: result.success.length,
        failed: result.failed.length,
      });

      if (result.failed.length > 0) {
        const failedList = result.failed
          .map((f: any) => `${f.fileName}: ${f.error}`)
          .join('\n');
        alert(
          `批量上传完成！\n成功: ${result.success.length}\n失败: ${result.failed.length}\n\n失败详情:\n${failedList}`
        );
      } else {
        alert(
          `批量上传成功！共上传 ${result.success.length} 份简历，系统正在解析...`
        );
      }

      loadResumes();
      loadImportReport();
    } catch (error: any) {
      console.error('批量上传失败:', error);
      alert(error.message || '批量上传失败，请重试');
    } finally {
      setUploadingFile(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleReparse = async (id: number) => {
    if (!confirm('确定要重新解析该简历吗？')) return;

    try {
      await api.post(`/resumes/${id}/reparse`);
      alert('已开始重新解析，请稍后刷新查看结果');
      setTimeout(() => loadResumes(), 2000);
    } catch (error: any) {
      console.error('重新解析失败:', error);
      alert(error.message || '重新解析失败');
    }
  };

  const handleDownload = async (id: number, fileName?: string) => {
    try {
      const response = await api.get(`/resumes/${id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `resume_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('下载失败:', error);
      alert(error.message || '下载失败');
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

  const getParseStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '解析中',
      success: '已解析',
      failed: '解析失败',
    };
    return statusMap[status] || status;
  };

  const getParseStatusColor = (status: string) => {
    const colorMap: Record<
      string,
      'default' | 'secondary' | 'outline' | 'destructive'
    > = {
      pending: 'secondary',
      success: 'default',
      failed: 'destructive',
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
          <input
            ref={singleFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.json"
            onChange={handleFileUpload}
            disabled={uploadingFile}
            style={{ display: 'none' }}
          />
          <Button
            onClick={() => singleFileInputRef.current?.click()}
            disabled={uploadingFile}
          >
            {uploadingFile ? '上传中...' : '📄 导入单个'}
          </Button>
          
          <input
            ref={batchFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.json"
            multiple
            onChange={handleBatchUpload}
            disabled={uploadingFile}
            style={{ display: 'none' }}
          />
          <Button
            onClick={() => batchFileInputRef.current?.click()}
            disabled={uploadingFile}
            variant="outline"
          >
            {uploadingFile ? '上传中...' : '📦 批量导入'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(!showImportDialog)}
          >
            📊 导入报告
          </Button>
        </div>
      </div>

      {/* 上传进度 */}
      {uploadProgress && (
        <Card className="p-4 mb-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="font-semibold">上传进度</span>
            <span>
              总数: {uploadProgress.total} | 成功: {uploadProgress.success} |
              失败: {uploadProgress.failed}
            </span>
          </div>
        </Card>
      )}

      {/* 导入报告 */}
      {showImportDialog && importReport && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">我的导入报告</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {importReport.totalImported}
              </div>
              <div className="text-sm text-gray-600">总导入数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {importReport.successCount}
              </div>
              <div className="text-sm text-gray-600">成功解析</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {importReport.failedCount}
              </div>
              <div className="text-sm text-gray-600">解析失败</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {importReport.pendingCount}
              </div>
              <div className="text-sm text-gray-600">解析中</div>
            </div>
          </div>
          {importReport.failedCount > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              💡 解析失败的简历可以点击"重新解析"按钮重试
            </div>
          )}
        </Card>
      )}

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
                  <Badge variant={getParseStatusColor(resume.parseStatus)}>
                    {getParseStatusLabel(resume.parseStatus)}
                  </Badge>
                </div>

                {resume.parseStatus === 'failed' && resume.parseError && (
                  <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ 解析错误: {resume.parseError}
                  </div>
                )}

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p>📱 {resume.phone}</p>
                  <p>📧 {resume.email}</p>
                  {resume.yearsOfExperience !== undefined && (
                    <p>💼 工作经验: {resume.yearsOfExperience}年</p>
                  )}
                  {resume.job && <p>🎯 应聘岗位: {resume.job.title}</p>}
                  {resume.fileName && (
                    <p className="text-xs text-gray-400">
                      📎 原始文件: {resume.fileName}
                    </p>
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

              <div className="flex flex-col gap-2">
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
                </div>
                <div className="flex gap-2">
                  {resume.filePath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resume.id, resume.fileName)}
                    >
                      下载
                    </Button>
                  )}
                  {resume.parseStatus === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReparse(resume.id)}
                    >
                      重新解析
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resume.id)}
                  >
                    删除
                  </Button>
                </div>
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

