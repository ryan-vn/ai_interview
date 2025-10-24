# AI 简历解析实战示例

## 完整流程演示

### 步骤 1: 上传 PDF 简历

访问 http://localhost:3000/admin/resumes

点击 **"📄 导入单个"** 按钮，选择一个 PDF 简历文件。

### 步骤 2: 后端处理流程

#### 2.1 文件上传（ResumesController）

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', { ... }))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body('jobId') jobId: string,
  @CurrentUser() user: any,
) {
  return this.resumesService.uploadResume(file, jobIdNum, user.userId);
}
```

#### 2.2 保存文件和创建记录（ResumesService）

```typescript
async uploadResume(file, jobId, userId) {
  // 1. 验证文件类型和大小
  const allowedTypes = ['application/pdf', 'text/plain', ...];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('不支持的文件类型');
  }

  // 2. 创建简历记录（状态：PENDING）
  const resume = this.resumesRepository.create({
    name: '待解析',
    phone: `temp_${Date.now()}`,
    email: `temp_${Date.now()}@pending.com`,
    fileName: file.originalname,
    filePath: file.path,  // 保存原始文件路径！
    jobId,
    importedBy: userId,
    parseStatus: ParseStatus.PENDING,
  });

  const savedResume = await this.resumesRepository.save(resume);

  // 3. 记录审计日志
  await this.auditService.log(
    savedResume.id,
    ResumeActionType.UPLOAD,
    userId,
    { fileName: file.originalname, fileSize: file.size }
  );

  // 4. 异步调用 AI 解析
  this.parseResumeAsync(savedResume.id, file.path, userId);

  return savedResume;
}
```

#### 2.3 AI 解析（AiService）

```typescript
async parseResume(filePath: string): Promise<ParsedResume> {
  // 步骤 1: 提取 PDF 文本
  const text = await this.extractTextFromFile(filePath);
  
  // 步骤 2: 调用 DeepSeek API
  const completion = await this.openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的简历解析助手...`
      },
      {
        role: 'user',
        content: `请解析以下简历内容：\n\n${text}`
      }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  // 步骤 3: 解析 JSON 结果
  const parsed = JSON.parse(completion.choices[0].message.content);

  // 步骤 4: 验证和清洗数据
  parsed.skills = parsed.skills || [];
  parsed.experience = parsed.experience || [];
  parsed.education = parsed.education || [];

  return parsed;
}
```

#### 2.4 提取 PDF 文本

```typescript
private async extractTextFromFile(filePath: string): Promise<string> {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  if (ext === 'pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF 文件内容为空或无法提取文本');
    }
    
    return data.text;
  }
  // ... 其他格式处理
}
```

### 步骤 3: AI 返回数据示例

```json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "gender": "男",
  "age": 28,
  "skills": [
    "Java",
    "Spring Boot",
    "MySQL",
    "Redis",
    "Kubernetes",
    "微服务架构"
  ],
  "experience": [
    {
      "company": "阿里巴巴集团",
      "title": "高级Java工程师",
      "startDate": "2020-06",
      "endDate": "至今",
      "description": "负责核心支付系统的开发和维护，使用Spring Cloud微服务架构..."
    },
    {
      "company": "腾讯科技",
      "title": "Java开发工程师",
      "startDate": "2018-07",
      "endDate": "2020-05",
      "description": "参与社交平台后端开发，负责用户系统和消息推送..."
    }
  ],
  "education": [
    {
      "school": "清华大学",
      "degree": "本科",
      "major": "计算机科学与技术",
      "startYear": 2014,
      "endYear": 2018
    }
  ],
  "yearsOfExperience": 5,
  "summary": "5年Java开发经验，熟悉微服务架构，有大型互联网项目经验"
}
```

### 步骤 4: 更新数据库

```typescript
private async parseResumeAsync(resumeId, filePath, userId) {
  setTimeout(async () => {
    try {
      // 调用 AI 解析
      const parsed = await this.aiService.parseResume(filePath);

      // 检查手机号是否重复
      if (parsed.phone) {
        const existingByPhone = await this.resumesRepository.findOne({
          where: { phone: parsed.phone, isDeleted: false }
        });
        
        if (existingByPhone && existingByPhone.id !== resumeId) {
          // 手机号重复，标记为失败
          resume.parseStatus = ParseStatus.FAILED;
          resume.parseError = `手机号 ${parsed.phone} 已存在`;
          await this.resumesRepository.save(resume);
          return;
        }
      }

      // 更新简历信息
      Object.assign(resume, {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email,
        gender: parsed.gender,
        age: parsed.age,
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        yearsOfExperience: parsed.yearsOfExperience,
        parseStatus: ParseStatus.SUCCESS,
        parseError: null,
      });

      await this.resumesRepository.save(resume);

      // 记录审计日志
      await this.auditService.log(
        resumeId,
        ResumeActionType.PARSE,
        userId,
        { status: 'success', name: resume.name }
      );

      console.log(`简历解析成功: ${resume.name}`);
      
    } catch (error) {
      // 解析失败处理
      resume.parseStatus = ParseStatus.FAILED;
      resume.parseError = error.message;
      await this.resumesRepository.save(resume);
      
      await this.auditService.log(
        resumeId,
        ResumeActionType.PARSE,
        userId,
        { status: 'failed', error: resume.parseError }
      );
    }
  }, 2000); // 延迟2秒执行
}
```

## 实际测试案例

### 案例 1: 标准格式简历

**输入 PDF**:
```
张三的简历

个人信息
姓名：张三
性别：男
年龄：28岁
手机：138-0013-8000
邮箱：zhangsan@example.com

技能
- Java、Spring Boot、MySQL
- Redis、Kafka、Docker
- 微服务架构

工作经历
阿里巴巴集团 | 高级Java工程师 | 2020.06 - 至今
- 负责核心支付系统开发

教育背景
清华大学 | 本科 | 计算机科学与技术 | 2014-2018
```

**AI 解析结果**:
```json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "gender": "男",
  "age": 28,
  "skills": ["Java", "Spring Boot", "MySQL", "Redis", "Kafka", "Docker", "微服务架构"],
  "experience": [{
    "company": "阿里巴巴集团",
    "title": "高级Java工程师",
    "startDate": "2020-06",
    "endDate": "至今",
    "description": "负责核心支付系统开发"
  }],
  "education": [{
    "school": "清华大学",
    "degree": "本科",
    "major": "计算机科学与技术",
    "startYear": 2014,
    "endYear": 2018
  }],
  "yearsOfExperience": 4
}
```

✅ **解析状态**: SUCCESS

---

### 案例 2: 格式不规范的简历

**输入 PDF**:
```
我是李四，今年25岁，
电话是139 1234 5678
qq邮箱是12345@qq.com

做过2年的前端开发，会用react和vue
在小米工作过
```

**AI 解析结果**:
```json
{
  "name": "李四",
  "phone": "13912345678",
  "email": "12345@qq.com",
  "age": 25,
  "skills": ["React", "Vue", "前端开发"],
  "experience": [{
    "company": "小米",
    "title": "前端开发",
    "startDate": null,
    "endDate": null,
    "description": null
  }],
  "education": [],
  "yearsOfExperience": 2
}
```

⚠️ **解析状态**: SUCCESS（但部分字段缺失）

---

### 案例 3: 扫描件 PDF（图片）

**输入**: 扫描的简历图片（PDF 格式）

**错误信息**:
```
PDF 文件内容为空或无法提取文本
```

❌ **解析状态**: FAILED

**解决方案**: 
1. 使用文本格式的 PDF
2. 或使用 OCR 服务（未来功能）
3. 或手动录入

---

### 案例 4: 英文简历

**输入 PDF**:
```
John Smith
Email: john@example.com
Phone: +1-234-567-8900

Skills:
- Python, Django, PostgreSQL
- AWS, Docker, Kubernetes

Experience:
Google Inc. | Senior Software Engineer | 2019-Present
- Led development of cloud infrastructure
```

**AI 解析结果**:
```json
{
  "name": "John Smith",
  "phone": "+1-234-567-8900",
  "email": "john@example.com",
  "skills": ["Python", "Django", "PostgreSQL", "AWS", "Docker", "Kubernetes"],
  "experience": [{
    "company": "Google Inc.",
    "title": "Senior Software Engineer",
    "startDate": "2019-01",
    "endDate": "至今",
    "description": "Led development of cloud infrastructure"
  }],
  "education": []
}
```

⚠️ **注意**: 手机号格式可能不符合中国标准

✅ **解析状态**: SUCCESS

---

## 前端实时状态显示

```typescript
// 轮询检查解析状态
useEffect(() => {
  if (resumeId && parseStatus === 'pending') {
    const timer = setInterval(async () => {
      const updated = await api.get(`/resumes/${resumeId}`);
      
      if (updated.data.parseStatus !== 'pending') {
        clearInterval(timer);
        setResume(updated.data);
        
        if (updated.data.parseStatus === 'success') {
          alert(`解析成功！姓名: ${updated.data.name}`);
        } else {
          alert(`解析失败: ${updated.data.parseError}`);
        }
      }
    }, 2000);
    
    return () => clearInterval(timer);
  }
}, [resumeId, parseStatus]);
```

## 性能监控

### 日志示例

```
[2025-10-24 10:00:00] [AiService] 开始解析简历文件: uploads/resumes/abc123.pdf
[2025-10-24 10:00:00] [AiService] 正在提取文件内容，格式: pdf
[2025-10-24 10:00:01] [AiService] 成功提取 PDF 文本，长度: 1524 字符
[2025-10-24 10:00:01] [AiService] 文本提取成功，准备调用 AI 解析...
[2025-10-24 10:00:03] [AiService] 简历解析成功: 张三，耗时: 2341ms
[2025-10-24 10:00:03] [ResumesService] Resume parsing success: 张三
```

### 性能指标

| 步骤 | 平均耗时 |
|------|---------|
| 文件上传 | 100-500ms |
| PDF 文本提取 | 200-800ms |
| AI 解析 | 2000-4000ms |
| 数据库保存 | 50-200ms |
| **总计** | **2350-5500ms** |

## 错误处理示例

### 错误类型 1: 文件格式错误

```javascript
try {
  await uploadResume(file);
} catch (error) {
  if (error.message.includes('文件类型')) {
    alert('请上传 PDF、TXT 或 JSON 格式的简历');
  }
}
```

### 错误类型 2: AI 解析失败

```javascript
// 后端日志
[AiService] 解析简历失败（耗时: 2100ms）: AI返回的数据格式错误，请重试

// 前端处理
if (resume.parseStatus === 'failed') {
  console.error('解析失败:', resume.parseError);
  
  // 提供重新解析按钮
  <Button onClick={() => reparseResume(resume.id)}>
    重新解析
  </Button>
}
```

### 错误类型 3: 手机号重复

```javascript
// 后端检测
if (existingByPhone && existingByPhone.id !== resumeId) {
  resume.parseStatus = ParseStatus.FAILED;
  resume.parseError = `手机号 ${parsed.phone} 已存在`;
  await this.resumesRepository.save(resume);
}

// 前端显示
<div className="text-red-600">
  ⚠️ {resume.parseError}
</div>
```

## 优化建议

### 1. 提高解析准确率

```typescript
// 改进 AI Prompt
const systemPrompt = `
你是一个专业的简历解析助手。

特别注意：
1. 手机号必须是11位纯数字，去除所有符号
2. 工作经历按时间倒序排列
3. 技能列表要去重和标准化
4. 如果工作时间没有明确月份，使用 01 月
5. 确保所有 JSON 字段名称严格匹配
`;
```

### 2. 批量处理优化

```typescript
// 使用 Promise.all 并行处理
const results = await Promise.all(
  files.map(file => uploadAndParse(file))
);
```

### 3. 缓存优化

```typescript
// 缓存解析结果
const cacheKey = `resume:parsed:${fileHash}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const parsed = await aiService.parseResume(filePath);
await redis.setex(cacheKey, 3600, JSON.stringify(parsed));
```

## 总结

✅ **完整流程**:
1. 前端上传 PDF → 
2. 后端保存文件 → 
3. 提取文本 → 
4. AI 解析 → 
5. 返回结构化数据 → 
6. 保存到数据库

✅ **核心特性**:
- 自动提取 PDF 文本
- AI 智能识别字段
- 异步处理不阻塞
- 完整的错误处理
- 支持重新解析
- 操作审计日志

✅ **数据保护**:
- 原始文件永久保存
- 支持下载查看
- 解析失败可重试
- 手动编辑备选方案

现在你可以直接上传 PDF 简历，系统会自动调用 AI 分析并返回结构化数据！🎉

