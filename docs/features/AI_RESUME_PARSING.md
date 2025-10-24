# AI 简历解析功能使用指南

## 功能概述

当前端上传 PDF 简历时，系统会自动：
1. 保存原始文件到服务器
2. 提取 PDF 文本内容
3. 调用 DeepSeek AI 智能解析
4. 返回结构化数据
5. 保存到数据库

## 工作流程

```
前端上传 PDF
    ↓
后端保存文件 (uploads/resumes/xxx.pdf)
    ↓
提取 PDF 文本内容
    ↓
调用 DeepSeek API 解析
    ↓
返回结构化数据
    ↓
保存到数据库
```

## 返回的数据结构

```typescript
interface ParsedResume {
  name: string;              // 姓名
  phone: string;             // 手机号（11位数字）
  email: string;             // 邮箱
  gender?: string;           // 性别（男/女）
  age?: number;              // 年龄
  skills: string[];          // 技能列表
  experience: Array<{        // 工作经历
    company: string;         // 公司名称
    title: string;           // 职位
    startDate: string;       // 开始时间 (YYYY-MM)
    endDate: string;         // 结束时间 (YYYY-MM 或 '至今')
    description?: string;    // 工作描述
  }>;
  education: Array<{         // 教育经历
    school: string;          // 学校名称
    degree: string;          // 学历
    major?: string;          // 专业
    startYear: number;       // 开始年份
    endYear: number;         // 结束年份
  }>;
  yearsOfExperience?: number; // 总工作年限
  summary?: string;           // 个人简介
}
```

## 使用示例

### 前端上传

```typescript
// 上传单个简历
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  // 可选：关联岗位
  formData.append('jobId', '1');

  const response = await api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('上传成功:', response.data);
};
```

### 后端处理流程

```typescript
// 1. 保存文件
const resume = this.resumesRepository.create({
  name: '待解析',
  fileName: file.originalname,
  filePath: file.path,
  parseStatus: ParseStatus.PENDING,
});
await this.resumesRepository.save(resume);

// 2. 异步调用 AI 解析
setTimeout(async () => {
  const parsed = await this.aiService.parseResume(file.path);
  
  // 3. 更新简历信息
  Object.assign(resume, {
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email,
    skills: parsed.skills,
    experience: parsed.experience,
    education: parsed.education,
    parseStatus: ParseStatus.SUCCESS,
  });
  
  await this.resumesRepository.save(resume);
}, 2000);
```

## AI 解析特性

### 1. 智能字段提取

AI 会自动识别并提取：
- ✅ 个人基本信息（姓名、联系方式）
- ✅ 工作经历（公司、职位、时间、描述）
- ✅ 教育背景（学校、学历、专业）
- ✅ 技能列表（编程语言、框架、工具等）
- ✅ 工作年限
- ✅ 个人简介

### 2. 数据清洗

- 手机号自动去除空格、横线等符号
- 邮箱格式验证
- 日期格式统一为 YYYY-MM
- 技能去重和标准化

### 3. 容错处理

- 如果某些字段缺失，返回 null 或空数组
- 提供详细的错误日志
- 支持重新解析功能

## 支持的文件格式

| 格式 | 状态 | 说明 |
|------|------|------|
| PDF | ✅ 支持 | 使用 pdf-parse 库提取文本 |
| TXT | ✅ 支持 | 直接读取文本内容 |
| JSON | ✅ 支持 | 用于数据导入 |
| DOC | ❌ 暂不支持 | 请转换为 PDF 后上传 |
| DOCX | ❌ 暂不支持 | 请转换为 PDF 后上传 |

## 解析状态说明

### pending（解析中）
- 文件已上传，等待 AI 解析
- 显示临时数据（name: "待解析"）

### success（解析成功）
- AI 成功提取所有字段
- 数据已保存到数据库

### failed（解析失败）
- AI 解析出错
- 可查看具体错误原因
- 支持重新解析或手动编辑

## 常见问题

### Q1: PDF 文件内容为空或无法提取？

**原因**：
- PDF 是扫描件（图片格式）
- PDF 有密码保护
- PDF 格式损坏

**解决方案**：
1. 确保 PDF 是文本格式（不是扫描件）
2. 移除 PDF 密码保护
3. 重新生成 PDF 文件
4. 或手动录入简历信息

### Q2: AI 解析结果不准确？

**原因**：
- 简历格式不规范
- 内容过于简单或复杂
- AI 理解偏差

**解决方案**：
1. 使用标准简历模板
2. 点击"重新解析"重试
3. 手动编辑修正错误字段

### Q3: 解析速度慢？

**原因**：
- DeepSeek API 响应时间
- 文件过大
- 网络延迟

**优化**：
- 系统使用异步解析，不阻塞上传
- 2-5 秒内完成解析
- 可批量上传，并行处理

### Q4: 手机号或邮箱格式错误？

**处理**：
- AI 会尽量提取和清洗数据
- 系统会验证手机号（11位）和邮箱格式
- 格式错误会在日志中警告
- 可手动修正

## API 调用日志示例

```
[AiService] 开始解析简历文件: uploads/resumes/abc123.pdf
[AiService] 正在提取文件内容，格式: pdf
[AiService] 成功提取 PDF 文本，长度: 1524 字符
[AiService] 文本提取成功，准备调用 AI 解析...
[AiService] 简历解析成功: 张三，耗时: 2341ms
```

## 配置说明

### 环境变量

在 `backend/.env` 中配置：

```env
# DeepSeek API Key
DEEPSEEK_API_KEY=your-api-key-here
```

如果未配置，系统会使用默认 API Key 并在日志中警告。

### AI 参数

```typescript
{
  model: 'deepseek-chat',      // 使用 DeepSeek Chat 模型
  temperature: 0.2,            // 降低随机性，提高准确性
  response_format: { type: 'json_object' }  // 强制返回 JSON
}
```

## 性能指标

- **单个解析时间**: 2-5 秒
- **批量处理**: 支持 100 个并发
- **成功率**: 通常 >90%（取决于简历质量）
- **Token 消耗**: 每份简历约 500-1500 tokens

## 最佳实践

### 1. 简历格式建议

推荐使用以下格式的简历：
- 清晰的标题（个人信息、工作经历、教育背景等）
- 标准的日期格式
- 完整的联系方式
- 明确的技能列表

### 2. 批量上传策略

```typescript
// 分批上传，避免一次性上传过多
const batchSize = 20;
for (let i = 0; i < files.length; i += batchSize) {
  const batch = files.slice(i, i + batchSize);
  await uploadBatch(batch);
  await delay(1000); // 避免 API 限流
}
```

### 3. 错误处理

```typescript
try {
  const resume = await uploadResume(file);
  
  // 等待解析完成
  const checkStatus = setInterval(async () => {
    const updated = await getResume(resume.id);
    
    if (updated.parseStatus === 'success') {
      clearInterval(checkStatus);
      console.log('解析成功:', updated);
    } else if (updated.parseStatus === 'failed') {
      clearInterval(checkStatus);
      console.error('解析失败:', updated.parseError);
      // 提示用户重新解析或手动编辑
    }
  }, 2000);
  
} catch (error) {
  console.error('上传失败:', error);
}
```

## 后续优化方向

### 短期优化
- [ ] 支持 DOCX 格式解析（使用 mammoth 库）
- [ ] 增加 OCR 识别支持（处理扫描件）
- [ ] 优化 AI Prompt，提高准确率
- [ ] 添加解析质量评分

### 长期优化
- [ ] 支持多语言简历
- [ ] 简历智能打分
- [ ] 岗位匹配推荐
- [ ] 简历去重检测
- [ ] 自动提取简历照片

## 相关文档

- [简历管理模块完善总结](./RESUME_MANAGEMENT_ENHANCEMENT.md)
- [简历管理快速开始](./RESUME_QUICK_START.md)
- [API 文档](http://localhost:3001/api)

