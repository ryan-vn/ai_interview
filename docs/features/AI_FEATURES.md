# AI功能使用文档

本文档介绍系统中集成的AI功能及其使用方法。

## 配置

### 1. 获取DeepSeek API Key

访问 [DeepSeek官网](https://platform.deepseek.com/) 注册并获取API Key。

### 2. 配置环境变量

在 `.env` 文件中配置：

```env
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

或者直接在 `backend/src/ai/ai.service.ts` 中修改：

```typescript
this.openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});
```

## 功能列表

### 1. 智能简历解析 ✨

**功能描述**：自动解析PDF、DOC、TXT等格式的简历文件，提取结构化信息。

**提取字段**：
- 基本信息：姓名、手机、邮箱、性别、年龄
- 工作经历：公司、职位、时间、描述
- 教育经历：学校、学历、专业、时间
- 技能列表：所有提到的技术、工具、语言
- 工作年限、个人简介

**使用方式**：

1. **通过前端上传**：
   - 访问 `/admin/resumes`
   - 点击"导入简历"
   - 选择文件上传
   - 系统自动解析（2-5秒）

2. **通过API调用**：
```bash
POST /api/ai/parse-resume
Content-Type: multipart/form-data

file: <resume-file>
```

**示例响应**：
```json
{
  "success": true,
  "data": {
    "name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "skills": ["Java", "Spring", "MySQL", "Redis"],
    "experience": [
      {
        "company": "某科技公司",
        "title": "高级Java工程师",
        "startDate": "2020-01",
        "endDate": "至今",
        "description": "负责后端系统开发..."
      }
    ],
    "education": [
      {
        "school": "某某大学",
        "degree": "本科",
        "major": "计算机科学与技术",
        "startYear": 2016,
        "endYear": 2020
      }
    ],
    "yearsOfExperience": 5
  }
}
```

### 2. 智能题目标签生成 🏷️

**功能描述**：为面试题目自动生成相关标签，便于分类和检索。

**使用方式**：

```bash
POST /api/ai/generate-question-tags

{
  "title": "实现一个LRU缓存",
  "description": "设计并实现一个LRU缓存机制..."
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "tags": ["算法", "数据结构", "缓存", "哈希表", "链表"]
  }
}
```

### 3. AI生成面试题目 🎯

**功能描述**：根据岗位要求自动生成面试题目。

**使用方式**：

```bash
POST /api/ai/generate-questions

{
  "jobTitle": "高级Java开发工程师",
  "requirements": "精通Java、Spring Boot、MySQL，熟悉Redis、Kafka...",
  "count": 5
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "title": "Spring Boot自动配置原理",
        "description": "请详细说明Spring Boot的自动配置机制...",
        "type": "technical_qa",
        "difficulty": "medium",
        "tags": ["Spring Boot", "Java", "框架"],
        "standardAnswer": "Spring Boot通过@EnableAutoConfiguration...",
        "answerPoints": [
          "条件注解的作用",
          "自动配置类的加载机制",
          "如何自定义自动配置"
        ]
      }
    ]
  }
}
```

### 4. 智能题目推荐 📋

**功能描述**：从现有题库中推荐与岗位最匹配的题目。

**使用方式**：

```bash
POST /api/ai/recommend-questions

{
  "jobTitle": "前端开发工程师",
  "requirements": "熟练掌握React、TypeScript...",
  "availableQuestions": [
    {
      "id": 1,
      "title": "React Hooks原理",
      "description": "...",
      "tags": ["React", "前端"]
    }
  ],
  "limit": 10
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "questionIds": [1, 5, 8, 12, 15]
  }
}
```

### 5. 关键词提取 🔍

**功能描述**：从简历或岗位描述中提取技能关键词。

**简历关键词提取**：
```bash
POST /api/ai/extract-resume-keywords

{
  "text": "5年Java开发经验，精通Spring Boot、微服务架构..."
}
```

**岗位关键词提取**：
```bash
POST /api/ai/extract-job-keywords

{
  "jobTitle": "后端工程师",
  "requirements": "要求熟练掌握Java、Spring、MySQL..."
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "keywords": ["Java", "Spring Boot", "MySQL", "Redis", "微服务"]
  }
}
```

### 6. AI增强的岗位匹配 🎲

**功能描述**：使用AI深度分析简历与岗位的匹配程度。

**使用方式**：

```bash
POST /api/ai/calculate-match

{
  "resumeText": "候选人简历全文...",
  "jobTitle": "高级Java工程师",
  "jobRequirements": "岗位要求描述..."
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "score": 85,
    "analysis": "候选人具有5年Java开发经验，熟练掌握Spring Boot、MySQL等核心技术，完全符合岗位要求。在分布式系统和微服务架构方面有丰富经验，是本岗位的理想人选。",
    "strengths": [
      "扎实的Java基础和Spring Boot经验",
      "具备大型项目的实战经验",
      "良好的系统架构能力"
    ],
    "weaknesses": [
      "缺少Kafka使用经验",
      "云原生技术栈需要加强",
      "英语能力未提及"
    ]
  }
}
```

## 集成到业务流程

### 简历导入流程

```
用户上传简历 
  → 保存文件
  → 创建简历记录（状态：pending）
  → 异步调用AI解析
  → 更新简历信息（状态：success/failed）
  → 自动提取关键词
  → 计算与所有开放岗位的匹配度
```

### 创建面试流程

```
HR创建面试
  → 选择岗位
  → AI推荐题目（从题库）
  → HR确认或调整题目
  → 生成面试场次
  → 发送邀请
```

### 题目管理流程

```
创建题目
  → 输入标题和描述
  → AI自动生成标签
  → HR确认或修改
  → 保存到题库
```

## 性能和成本

### API调用成本

DeepSeek API定价（参考）：
- 输入：¥1/百万tokens
- 输出：¥2/百万tokens

### 预计成本

| 操作 | 平均Tokens | 预计成本 |
|------|-----------|---------|
| 解析一份简历 | ~2000 | ¥0.004 |
| 生成5道题目 | ~3000 | ¥0.006 |
| 推荐题目 | ~1500 | ¥0.003 |
| 计算匹配度 | ~2000 | ¥0.004 |

**月度预估**：
- 100份简历解析：¥0.4
- 50次题目生成：¥0.3
- 200次匹配计算：¥0.8
- **总计：约 ¥2-5/月**

### 性能指标

- 简历解析：2-5秒
- 题目生成：3-8秒
- 标签生成：1-2秒
- 匹配计算：2-4秒

## 注意事项

### 1. API Key安全

⚠️ **切勿将API Key提交到Git仓库**

```bash
# 使用环境变量
export DEEPSEEK_API_KEY=sk-xxx

# 或在.env文件中配置（.env已在.gitignore中）
DEEPSEEK_API_KEY=sk-xxx
```

### 2. 错误处理

所有AI调用都有错误处理机制：
- 网络错误：自动重试1次
- API错误：返回友好错误信息
- 解析失败：标记为手动录入

### 3. 数据隐私

- 简历数据仅用于解析，不会被DeepSeek存储
- 建议在生产环境使用自建模型或私有部署

### 4. 限流

DeepSeek API限流：
- 免费版：60 RPM（每分钟请求数）
- 付费版：更高限流

建议：
- 使用队列异步处理
- 实现请求限流
- 缓存常见结果

## 故障排查

### 问题1：AI解析失败

**可能原因**：
- API Key配置错误
- 网络连接问题
- 简历格式不支持
- API限流

**解决方法**：
```bash
# 检查API Key
echo $DEEPSEEK_API_KEY

# 测试API连接
curl https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY"

# 查看日志
tail -f backend/logs/application.log
```

### 问题2：解析结果不准确

**优化方法**：
- 调整Prompt（在`ai.service.ts`中）
- 增加示例数据
- 降低temperature参数
- 使用更大的模型

### 问题3：响应太慢

**优化方法**：
- 减少输入文本长度
- 使用异步处理
- 实现结果缓存
- 考虑批处理

## 扩展开发

### 添加新的AI功能

1. 在 `ai.service.ts` 中添加方法
2. 在 `ai.controller.ts` 中添加接口
3. 更新文档

示例：
```typescript
// ai.service.ts
async analyzeInterviewPerformance(
  answers: string[],
  expectedAnswers: string[]
): Promise<{ score: number; feedback: string }> {
  // 实现逻辑
}

// ai.controller.ts
@Post('analyze-performance')
async analyzePerformance(@Body() data: any) {
  return this.aiService.analyzeInterviewPerformance(
    data.answers,
    data.expectedAnswers
  );
}
```

## 参考资源

- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [OpenAI SDK文档](https://github.com/openai/openai-node)
- [系统架构文档](../docs/TAD.md)

