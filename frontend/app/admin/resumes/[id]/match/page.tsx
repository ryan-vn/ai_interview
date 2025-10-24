'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useParams } from 'next/navigation';

interface Resume {
  id: number;
  name: string;
  skills: string[];
}

interface MatchRecommendation {
  jobId: number;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  details: string;
}

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  status: string;
}

export default function ResumeMatchPage() {
  const params = useParams();
  const resumeId = parseInt(params.id as string);

  const [resume, setResume] = useState<Resume | null>(null);
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [jobs, setJobs] = useState<Record<number, Job>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载简历信息
      const resumeRes = await api.get(`/resumes/${resumeId}`);
      setResume(resumeRes.data);

      // 获取岗位推荐
      const matchRes = await api.get(`/matching/recommend-jobs`, {
        params: { resumeId, limit: 10 },
      });
      setRecommendations(matchRes.data.recommendations || []);

      // 加载岗位详情
      const jobIds = matchRes.data.recommendations?.map((r: any) => r.jobId) || [];
      const jobsData: Record<number, Job> = {};
      for (const jobId of jobIds) {
        try {
          const jobRes = await api.get(`/jobs/${jobId}`);
          jobsData[jobId] = jobRes.data;
        } catch (error) {
          console.error(`加载岗位 ${jobId} 失败:`, error);
        }
      }
      setJobs(jobsData);
    } catch (error) {
      console.error('加载匹配数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToJob = async (jobId: number) => {
    if (!confirm('确定要将该简历关联到此岗位吗？')) return;
    try {
      await api.patch(`/resumes/${resumeId}/link-job/${jobId}`);
      alert('关联成功！');
      window.location.href = '/admin/resumes';
    } catch (error) {
      console.error('关联失败:', error);
      alert('关联失败，请重试');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return '高度匹配';
    if (score >= 50) return '中等匹配';
    return '低匹配度';
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/admin/resumes')}
        >
          ← 返回简历列表
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">岗位匹配</h1>
        <p className="text-gray-600">
          候选人: <strong>{resume.name}</strong>
        </p>
        {resume.skills && resume.skills.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">技能标签:</p>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <h2 className="text-xl font-semibold mb-4">推荐岗位（按匹配度排序）</h2>

      <div className="grid gap-4">
        {recommendations.map((rec) => {
          const job = jobs[rec.jobId];
          if (!job) return null;

          return (
            <Card key={rec.jobId} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <Badge>{job.department}</Badge>
                    {job.location && (
                      <Badge variant="outline">{job.location}</Badge>
                    )}
                  </div>

                  <div className="mb-3">
                    <span className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                      {rec.score.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      {getScoreLabel(rec.score)}
                    </span>
                  </div>

                  {rec.matchedKeywords && rec.matchedKeywords.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">✅ 匹配的技能:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.matchedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="default">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.missingKeywords && rec.missingKeywords.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">⚠️ 缺失的技能:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.missingKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/admin/jobs/${rec.jobId}`, '_blank')}
                  >
                    查看岗位
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleLinkToJob(rec.jobId)}
                  >
                    关联岗位
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">暂无匹配的岗位</p>
        </Card>
      )}
    </div>
  );
}

