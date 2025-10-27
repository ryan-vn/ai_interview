# AI功能集成指南

本文档说明如何将AI功能集成到现有业务模块中。

## 快速开始

### 1. 安装依赖

```bash
cd backend
pnpm install openai pdf-parse
```

### 2. 配置API Key

```bash
# 复制环境变量模板
cp env.example .env

# 编辑.env文件，添加DeepSeek API Key
nano .env
```

在`.env`中添加：
```env
DEEPSEEK_API_KEY=sk-your-api-key-here
```

### 3. 更新服务配置

修改 `backend/src/ai/ai.service.ts`：

```typescript
constructor() {
  this.openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
  
  if (!process.env.DEEPSEEK_API_KEY) {
    this.logger.warn('DeepSeek API Key未配置，AI功能将不可用');
  }
}
```

### 4. 启动服务

```bash
pnpm run start:dev
```

### 5. 测试AI功能

访问 Swagger文档测试：
```
http://localhost:3000/api#/AI服务
```

## 业务模块集成

### 简历管理模块集成

#### 1. 自动解析简历

简历上传后自动调用AI解析：

```typescript
// resumes.service.ts
async uploadResume(file: Express.Multer.File, jobId: number, userId: number) {
  // 创建简历记录
  const resume = await this.createInitialResume(file, jobId, userId);
  
  // 异步解析
  this.parseResumeAsync(resume.id, file.path);
  
  return resume;
}

private async parseResumeAsync(resumeId: number, filePath: string) {
  try {
    // 调用AI解析
    const parsed = await this.aiService.parseResume(filePath);
    
    // 更新简历信息
    await this.updateResumeFromParsed(resumeId, parsed);
  } catch (error) {
    // 标记解析失败
    await this.markParseFailed(resumeId, error.message);
  }
}
```

#### 2. 前端显示解析状态

```typescript
// frontend/app/admin/resumes/page.tsx
{resume.parseStatus === 'pending' && (
  <Badge variant="secondary">
    <Loader2 className="w-3 h-3 animate-spin mr-1" />
    解析中...
  </Badge>
)}

{resume.parseStatus === 'success' && (
  <Badge variant="default">✓ 已解析</Badge>
)}

{resume.parseStatus === 'failed' && (
  <Badge variant="destructive">
    解析失败
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>ⓘ</TooltipTrigger>
        <TooltipContent>{resume.parseError}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </Badge>
)}
```

### 题库管理模块集成

#### 1. 自动生成标签

创建题目时自动生成标签：

```typescript
// questions.controller.ts
@Post()
async create(@Body() dto: CreateQuestionDto, @CurrentUser() user: any) {
  // 如果没有提供标签，使用AI生成
  if (!dto.tags || dto.tags.length === 0) {
    const tags = await this.aiService.generateQuestionTags(
      dto.title,
      dto.description
    );
    dto.tags = tags;
  }
  
  return this.questionsService.create(dto, user.userId);
}
```

#### 2. 批量生成题目

```typescript
// questions.controller.ts
@Post('ai-generate')
@Roles('admin', 'hr')
async generateQuestions(
  @Body('jobId') jobId: number,
  @Body('count') count: number = 5,
) {
  // 获取岗位信息
  const job = await this.jobsService.findOne(jobId);
  
  // AI生成题目
  const questions = await this.aiService.generateInterviewQuestions(
    job.title,
    job.requirements,
    count
  );
  
  // 批量保存
  const saved = [];
  for (const q of questions) {
    const created = await this.questionsService.create(q, user.userId);
    saved.push(created);
  }
  
  return {
    success: true,
    data: saved,
    message: `成功生成${saved.length}道题目`
  };
}
```

### 面试管理模块集成

#### 1. 智能推荐题目

创建面试时推荐题目：

```typescript
// interviews.controller.ts
@Get('recommend-questions/:jobId')
async recommendQuestions(@Param('jobId') jobId: number) {
  // 获取岗位
  const job = await this.jobsService.findOne(jobId);
  
  // 获取所有题目
  const allQuestions = await this.questionsService.findAll();
  
  // AI推荐
  const recommendedIds = await this.aiService.recommendQuestionsForJob(
    job.title,
    job.requirements,
    allQuestions.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      tags: q.tags
    })),
    10
  );
  
  // 返回推荐的题目详情
  const questions = await this.questionsService.findByIds(recommendedIds);
  return questions;
}
```

### 匹配度模块集成

#### 1. 增强匹配计算

使用AI增强匹配度计算：

```typescript
// matching.service.ts
async calculateMatchEnhanced(resumeId: number, jobId: number) {
  // 基础匹配（Jaccard）
  const basicMatch = await this.calculateMatch(resumeId, jobId);
  
  // 获取详细信息
  const resume = await this.resumesRepository.findOne({ where: { id: resumeId }});
  const job = await this.jobsRepository.findOne({ where: { id: jobId }});
  
  // AI深度分析
  const aiAnalysis = await this.aiService.calculateMatchScore(
    this.buildResumeText(resume),
    job.title,
    job.requirements
  );
  
  // 综合评分：60% 基础匹配 + 40% AI分析
  const finalScore = basicMatch.score * 0.6 + aiAnalysis.score * 0.4;
  
  return {
    score: finalScore,
    basicScore: basicMatch.score,
    aiScore: aiAnalysis.score,
    analysis: aiAnalysis.analysis,
    strengths: aiAnalysis.strengths,
    weaknesses: aiAnalysis.weaknesses,
    matchedKeywords: basicMatch.matchedKeywords,
    missingKeywords: basicMatch.missingKeywords
  };
}
```

## 前端集成

### 1. AI生成题目页面

```typescript
// frontend/app/admin/questions/ai-generate/page.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function AiGeneratePage() {
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-questions', {
        jobTitle: 'Java开发工程师',
        requirements: '精通Java、Spring Boot...',
        count: 5
      });
      setQuestions(res.data.data.questions);
    } catch (error) {
      alert('生成失败');
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div>
      <Button onClick={handleGenerate} disabled={generating}>
        {generating ? 'AI生成中...' : 'AI生成题目'}
      </Button>
      
      {questions.map((q, i) => (
        <QuestionCard key={i} question={q} />
      ))}
    </div>
  );
}
```

### 2. 简历解析状态轮询

```typescript
// frontend/hooks/useResumeParseStatus.ts
export function useResumeParseStatus(resumeId: number) {
  const [status, setStatus] = useState('pending');
  
  useEffect(() => {
    if (status !== 'pending') return;
    
    const interval = setInterval(async () => {
      const res = await api.get(`/resumes/${resumeId}`);
      setStatus(res.data.parseStatus);
      
      if (res.data.parseStatus !== 'pending') {
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [resumeId, status]);
  
  return status;
}
```

## 最佳实践

### 1. 异步处理

所有AI调用都应该异步处理，避免阻塞用户操作：

```typescript
// ✅ 好的做法
async uploadResume(file) {
  const resume = await this.createResume(file);
  this.parseResumeAsync(resume.id, file.path); // 不await
  return resume; // 立即返回
}

// ❌ 不好的做法
async uploadResume(file) {
  const resume = await this.createResume(file);
  await this.parseResumeAsync(resume.id, file.path); // 等待5秒
  return resume;
}
```

### 2. 错误处理

```typescript
try {
  const result = await this.aiService.parseResume(filePath);
  // 处理成功
} catch (error) {
  this.logger.error('AI解析失败', error);
  
  // 降级处理
  if (error.code === 'RATE_LIMIT') {
    // 加入重试队列
    await this.retryQueue.add({ resumeId, filePath });
  } else {
    // 标记为手动录入
    await this.markForManualEntry(resumeId);
  }
}
```

### 3. 缓存结果

```typescript
// 缓存AI生成的标签
const cacheKey = `question_tags:${questionId}`;
let tags = await this.cache.get(cacheKey);

if (!tags) {
  tags = await this.aiService.generateQuestionTags(title, description);
  await this.cache.set(cacheKey, tags, 86400); // 缓存1天
}
```

### 4. 用户反馈

```typescript
// 允许用户修正AI结果
@Patch(':id/correct-parse')
async correctParse(@Param('id') id: number, @Body() corrections: any) {
  await this.resumesService.update(id, corrections);
  
  // 记录修正，用于改进模型
  await this.aiService.recordCorrection({
    resumeId: id,
    original: original,
    corrected: corrections,
    timestamp: new Date()
  });
}
```

## 监控和优化

### 1. 性能监控

```typescript
// ai.service.ts
async parseResume(filePath: string) {
  const startTime = Date.now();
  
  try {
    const result = await this.openai.chat.completions.create({...});
    
    const duration = Date.now() - startTime;
    this.logger.log(`AI解析耗时: ${duration}ms`);
    
    // 记录到监控系统
    this.metrics.record('ai.parse.duration', duration);
    
    return result;
  } catch (error) {
    this.metrics.increment('ai.parse.error');
    throw error;
  }
}
```

### 2. 成本控制

```typescript
// 实现配额限制
@Injectable()
export class AiQuotaService {
  private dailyUsage = new Map<string, number>();
  
  async checkQuota(userId: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}:${today}`;
    const usage = this.dailyUsage.get(key) || 0;
    
    // 每人每天限制100次AI调用
    return usage < 100;
  }
  
  async recordUsage(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}:${today}`;
    const usage = this.dailyUsage.get(key) || 0;
    this.dailyUsage.set(key, usage + 1);
  }
}
```

## 故障恢复

### 1. 重试机制

```typescript
async parseResumeWithRetry(filePath: string, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.parseResume(filePath);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.sleep(1000 * (i + 1)); // 指数退避
    }
  }
}
```

### 2. 降级策略

```typescript
async parseResume(filePath: string) {
  try {
    // 尝试AI解析
    return await this.aiService.parseResume(filePath);
  } catch (error) {
    // 降级到规则解析
    this.logger.warn('AI解析失败，使用规则解析');
    return await this.ruleBasedParser.parse(filePath);
  }
}
```

## 总结

AI功能已成功集成到系统中，主要特点：

✅ **简历智能解析** - 自动提取结构化信息
✅ **题目自动标签** - 智能分类管理
✅ **AI生成题目** - 快速扩充题库
✅ **智能推荐** - 精准匹配题目和候选人
✅ **增强匹配** - AI深度分析匹配度

下一步可以考虑：
- 集成更多AI模型
- 实现自定义Prompt
- 添加用户反馈机制
- 优化性能和成本

