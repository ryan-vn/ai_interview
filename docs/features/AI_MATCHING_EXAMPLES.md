# AI 智能匹配使用示例

## 基本使用

### 1. 单次匹配分析

```bash
# 计算简历1与岗位2的匹配度
curl -X GET "http://localhost:3001/matching/calculate?resumeId=1&jobId=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例：**

```json
{
  "id": 1,
  "resumeId": 1,
  "jobId": 2,
  "score": 85.5,
  "matchedKeywords": [
    "React",
    "TypeScript",
    "Node.js",
    "MySQL"
  ],
  "missingKeywords": [
    "Kubernetes",
    "AWS"
  ],
  "details": "【匹配度】86%\n\n【综合分析】\n该候选人具有丰富的前端开发经验，熟练掌握React和TypeScript等主流技术栈，工作年限符合要求。曾在知名互联网公司工作，有大型项目架构经验。整体技能匹配度较高。\n\n【匹配优势】\n1. 具有5年以上前端开发经验，符合岗位3-5年经验要求\n2. 精通React、Vue、TypeScript等主流前端框架和语言\n3. 有完整的项目全流程经验，包括需求分析、架构设计、开发实现等\n4. 具备良好的团队协作能力和代码规范意识\n\n【待提升项】\n1. 缺少Kubernetes容器编排相关实践经验\n2. 对AWS等云平台的实际使用经验较少\n3. 缺少大规模分布式系统的架构设计经验",
  "createdAt": "2024-10-24T10:30:00.000Z",
  "updatedAt": "2024-10-24T10:30:00.000Z"
}
```

### 2. 为简历推荐岗位

```bash
# 为简历1推荐最匹配的5个岗位
curl -X GET "http://localhost:3001/matching/recommend-jobs?resumeId=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例：**

```json
{
  "resumeId": 1,
  "recommendations": [
    {
      "jobId": 2,
      "score": 92.3,
      "matchedKeywords": ["React", "TypeScript", "Node.js", "MySQL", "Docker"],
      "missingKeywords": ["AWS"],
      "details": "【匹配度】92%\n\n【综合分析】\n高度匹配，候选人技能与岗位要求基本一致..."
    },
    {
      "jobId": 5,
      "score": 87.5,
      "matchedKeywords": ["React", "Vue", "JavaScript"],
      "missingKeywords": ["Angular", "GraphQL"],
      "details": "【匹配度】88%\n\n【综合分析】\n较高匹配度，主要技能符合要求..."
    },
    {
      "jobId": 8,
      "score": 75.0,
      "matchedKeywords": ["JavaScript", "TypeScript"],
      "missingKeywords": ["Python", "Django"],
      "details": "【匹配度】75%\n\n【综合分析】\n中等匹配度，部分技能符合..."
    }
  ]
}
```

### 3. 为岗位推荐候选人

```bash
# 为岗位2推荐最匹配的10个候选人
curl -X GET "http://localhost:3001/matching/recommend-resumes?jobId=2&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例：**

```json
{
  "jobId": 2,
  "recommendations": [
    {
      "resumeId": 1,
      "score": 92.3,
      "matchedKeywords": ["React", "TypeScript", "Node.js"],
      "missingKeywords": ["AWS"],
      "details": "【匹配度】92%\n\n【综合分析】\n..."
    },
    {
      "resumeId": 7,
      "score": 89.0,
      "matchedKeywords": ["React", "TypeScript", "MySQL"],
      "missingKeywords": ["Docker"],
      "details": "【匹配度】89%\n\n【综合分析】\n..."
    }
  ]
}
```

### 4. 批量计算匹配度

```bash
# 批量计算指定简历与指定岗位的匹配度
curl -X POST "http://localhost:3001/matching/batch-calculate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeIds": [1, 2, 3],
    "jobIds": [1, 2]
  }'
```

**响应示例：**

```json
{
  "total": 6,
  "completed": 6
}
```

```bash
# 计算所有简历与所有开放岗位的匹配度
curl -X POST "http://localhost:3001/matching/batch-calculate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## TypeScript/JavaScript 客户端示例

### React 前端示例

```typescript
import { useState } from 'react';
import { api } from '@/lib/api';

interface MatchResult {
  id: number;
  resumeId: number;
  jobId: number;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  details: string;
}

export function MatchingAnalysis({ resumeId, jobId }: { resumeId: number; jobId: number }) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateMatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/matching/calculate`, {
        params: { resumeId, jobId }
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>AI 正在分析匹配度...</div>;
  }

  if (error) {
    return <div className="text-red-500">错误: {error}</div>;
  }

  if (!result) {
    return (
      <button onClick={calculateMatch} className="btn btn-primary">
        开始 AI 匹配分析
      </button>
    );
  }

  return (
    <div className="match-result">
      <h2>匹配度分析结果</h2>
      
      <div className="score">
        <h3>匹配度：{result.score.toFixed(1)}%</h3>
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      <div className="keywords">
        <div>
          <h4>匹配的技能</h4>
          <div className="tags">
            {result.matchedKeywords.map(keyword => (
              <span key={keyword} className="tag tag-success">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4>缺失的技能</h4>
          <div className="tags">
            {result.missingKeywords.map(keyword => (
              <span key={keyword} className="tag tag-warning">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="details">
        <h4>详细分析</h4>
        <pre className="whitespace-pre-wrap">{result.details}</pre>
      </div>
    </div>
  );
}
```

### 岗位推荐列表

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface JobRecommendation {
  jobId: number;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  details: string;
}

export function JobRecommendations({ resumeId }: { resumeId: number }) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.get(`/matching/recommend-jobs`, {
          params: { resumeId, limit: 5 }
        });
        setRecommendations(response.data.recommendations);
      } catch (error) {
        console.error('获取推荐失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [resumeId]);

  if (loading) {
    return <div>AI 正在为您推荐最匹配的岗位...</div>;
  }

  return (
    <div className="recommendations">
      <h2>为您推荐的岗位</h2>
      
      {recommendations.map((rec) => (
        <div key={rec.jobId} className="recommendation-card">
          <div className="score-badge">
            匹配度: {rec.score.toFixed(1)}%
          </div>
          
          <h3>岗位 #{rec.jobId}</h3>
          
          <div className="keywords">
            <span>匹配技能：</span>
            {rec.matchedKeywords.slice(0, 3).join(', ')}
            {rec.matchedKeywords.length > 3 && ` +${rec.matchedKeywords.length - 3}`}
          </div>

          <button 
            onClick={() => window.location.href = `/jobs/${rec.jobId}`}
            className="btn btn-sm"
          >
            查看详情
          </button>
        </div>
      ))}
    </div>
  );
}
```

## NestJS 后端服务调用示例

```typescript
import { Injectable } from '@nestjs/common';
import { MatchingService } from './matching/matching.service';

@Injectable()
export class RecruitmentService {
  constructor(private matchingService: MatchingService) {}

  /**
   * 自动为新简历推荐合适的岗位
   */
  async autoRecommendJobsForNewResume(resumeId: number) {
    // 推荐前5个最匹配的岗位
    const recommendations = await this.matchingService.recommendJobsForResume(
      resumeId,
      5,
    );

    // 只保留匹配度大于60%的岗位
    const qualifiedJobs = recommendations.filter(r => r.score >= 60);

    // 发送通知给候选人
    if (qualifiedJobs.length > 0) {
      await this.sendJobRecommendationEmail(resumeId, qualifiedJobs);
    }

    return qualifiedJobs;
  }

  /**
   * 为岗位自动筛选候选人
   */
  async screenCandidatesForJob(jobId: number, minScore: number = 70) {
    const recommendations = await this.matchingService.recommendResumesForJob(
      jobId,
      20,
    );

    // 筛选出匹配度达标的候选人
    const qualifiedCandidates = recommendations.filter(
      r => r.score >= minScore,
    );

    // 按匹配度分级
    const excellent = qualifiedCandidates.filter(r => r.score >= 90);
    const good = qualifiedCandidates.filter(r => r.score >= 75 && r.score < 90);
    const qualified = qualifiedCandidates.filter(r => r.score >= 60 && r.score < 75);

    return {
      total: qualifiedCandidates.length,
      excellent: excellent.length,
      good: good.length,
      qualified: qualified.length,
      candidates: qualifiedCandidates,
    };
  }

  /**
   * 定期更新所有匹配度
   */
  async refreshAllMatches() {
    // 批量计算所有简历与开放岗位的匹配度
    const result = await this.matchingService.batchCalculateMatches();
    
    console.log(`匹配度更新完成: ${result.completed}/${result.total}`);
    
    return result;
  }

  private async sendJobRecommendationEmail(
    resumeId: number,
    jobs: any[],
  ): Promise<void> {
    // 实现邮件发送逻辑
    console.log(`发送岗位推荐邮件给简历 ${resumeId}，推荐岗位数: ${jobs.length}`);
  }
}
```

## 匹配度解读

### 分数区间

- **90-100分**：完美匹配
  - 技能完全符合，经验丰富
  - 建议优先面试

- **75-89分**：高度匹配
  - 核心技能符合，部分技能可培养
  - 建议安排面试

- **60-74分**：中等匹配
  - 基础技能符合，需要培训
  - 可以考虑

- **40-59分**：低度匹配
  - 较少技能符合
  - 需谨慎考虑

- **0-39分**：不匹配
  - 技能差距较大
  - 不建议

### 详细报告组成

1. **匹配度分数**：0-100的整数
2. **综合分析**：AI 生成的整体评价（200字以内）
3. **匹配优势**：候选人的3-5个优势点
4. **待提升项**：候选人的3-5个不足之处

## 最佳实践

### 1. 缓存策略

```typescript
// 避免频繁重复计算
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天

async function getMatchResultWithCache(resumeId: number, jobId: number) {
  const cached = await cache.get(`match:${resumeId}:${jobId}`);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = await matchingService.calculateMatch(resumeId, jobId);
  
  await cache.set(`match:${resumeId}:${jobId}`, {
    result,
    timestamp: Date.now(),
  });

  return result;
}
```

### 2. 批量处理优化

```typescript
// 使用队列处理大批量计算
import { Queue } from 'bull';

const matchQueue = new Queue('matching', {
  redis: { host: 'localhost', port: 6379 }
});

matchQueue.process(async (job) => {
  const { resumeId, jobId } = job.data;
  return await matchingService.calculateMatch(resumeId, jobId);
});

// 添加任务
async function queueBatchMatching(resumeIds: number[], jobIds: number[]) {
  for (const resumeId of resumeIds) {
    for (const jobId of jobIds) {
      await matchQueue.add({ resumeId, jobId });
    }
  }
}
```

### 3. 错误处理

```typescript
try {
  const result = await matchingService.calculateMatch(resumeId, jobId);
  return result;
} catch (error) {
  if (error.message.includes('AI')) {
    // AI 服务错误，可以降级到简单匹配
    console.error('AI 分析失败，使用备用方案');
    return fallbackMatching(resumeId, jobId);
  } else if (error.message.includes('不存在')) {
    // 数据不存在
    throw new NotFoundException('简历或岗位不存在');
  } else {
    // 其他错误
    throw error;
  }
}
```

## 性能监控

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('MatchingPerformance');

async function calculateMatchWithMetrics(resumeId: number, jobId: number) {
  const startTime = Date.now();
  
  try {
    const result = await matchingService.calculateMatch(resumeId, jobId);
    const duration = Date.now() - startTime;
    
    logger.log(`匹配计算完成: Resume ${resumeId} - Job ${jobId}, 耗时: ${duration}ms, 分数: ${result.score}`);
    
    // 记录到监控系统
    metrics.recordMatchingDuration(duration);
    metrics.recordMatchingScore(result.score);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`匹配计算失败: Resume ${resumeId} - Job ${jobId}, 耗时: ${duration}ms, 错误: ${error.message}`);
    throw error;
  }
}
```

## 相关文档

- [AI 匹配功能升级](./AI_MATCHING_UPGRADE.md)
- [API 文档](../api/MATCHING_API.md)
- [AI 服务集成指南](./AI_INTEGRATION_GUIDE.md)

