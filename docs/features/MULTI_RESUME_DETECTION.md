# 多简历检测与拆分功能

## 📋 功能概述

当一个文件中包含多个人的简历时，系统可以自动识别并拆分成多条独立的简历记录。这在以下场景中特别有用：

- 📦 批量简历打包文件
- 🎪 招聘会现场收集的合并简历  
- 📊 从招聘平台导出的合并文件
- 📄 团队成员统一提交的简历文档

## 🚀 功能特点

### 1. 智能检测

- ✅ 自动识别文件中包含的简历数量
- ✅ 区分同一人的多段经历和不同人的简历
- ✅ 基于姓名、联系方式等关键信息判断
- ✅ AI 驱动，准确率高

### 2. 自动拆分

- ✅ 将多个简历拆分为独立的记录
- ✅ 每份简历单独解析和存储
- ✅ 自动去重（基于手机号）
- ✅ 共享原始文件引用

### 3. 灵活控制

- ✅ 可选启用/禁用多简历检测
- ✅ 默认关闭，按需开启
- ✅ API 参数控制
- ✅ 失败自动降级到单简历处理

## 🔧 技术实现

### 架构设计

```
┌──────────────────────────────────────────────────────────┐
│ 1. 文件上传                                               │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  POST /resumes/upload                                     │
│  - file: resume.pdf                                       │
│  - detectMultiple: true  ← 启用多简历检测                │
│                                                           │
└─────────────────────────┬─────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 2. AI 检测简历数量                                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  detectMultipleResumesInText()                            │
│  - 提取文件文本                                           │
│  - AI 分析包含几份简历                                    │
│  - 返回: { isMultiple: true, count: 3 }                  │
│                                                           │
└─────────────────────────┬─────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 3. 单个 or 多个？                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  if (count <= 1)                                          │
│    → 按单个简历处理                                       │
│  else                                                     │
│    → 拆分解析多个简历                                     │
│                                                           │
└─────────────────────────┬─────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 4. 拆分并解析（多简历情况）                               │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  parseMultipleResumesFromText()                           │
│  - AI 拆分每份简历的内容                                  │
│  - 分别提取每份简历的信息                                 │
│  - 返回: ParsedResume[]                                   │
│                                                           │
└─────────────────────────┬─────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 5. 创建多条记录                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  handleMultipleResumes()                                  │
│  - 第1个：更新原记录                                      │
│  - 第2-N个：创建新记录                                    │
│  - 检查手机号去重                                         │
│  - 记录审计日志                                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 核心代码

#### 1. AI 检测

```typescript
/**
 * 使用 AI 检测文本中是否包含多个简历
 */
async detectMultipleResumesInText(text: string): Promise<{
  isMultiple: boolean;
  count: number;
}> {
  const completion = await this.openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `你是一个简历识别专家。请判断提供的文本中包含多少份简历。

判断标准：
1. 每份简历通常包含：姓名、联系方式、工作经历、教育背景
2. 如果有多个不同的姓名和联系方式，可能是多份简历
3. 注意区分同一人的多次工作经历和不同人的简历

返回 JSON 格式：
{
  "isMultiple": true/false,
  "count": 简历数量,
  "reason": "判断理由"
}`,
      },
      {
        role: 'user',
        content: `请分析以下文本包含多少份简历：\n\n${text}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
}
```

#### 2. AI 拆分

```typescript
/**
 * 从文本中解析多个简历
 */
async parseMultipleResumesFromText(text: string): Promise<ParsedResume[]> {
  const completion = await this.openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `你是专业的简历解析助手。文本中包含多份简历，请将每份简历分别提取出来。

返回 JSON 格式：
{
  "resumes": [
    {
      "name": "姓名",
      "phone": "手机号",
      "email": "邮箱",
      "skills": ["技能1", "技能2"],
      "experience": [...],
      "education": [...]
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `请解析以下多份简历：\n\n${text}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return parsed.resumes;
}
```

#### 3. 创建多条记录

```typescript
/**
 * 处理一个文件中的多个简历
 */
async handleMultipleResumes(
  originalResumeId: number,
  parsedResumes: ParsedResume[],
  filePath: string,
  jobId?: number,
  userId?: number,
): Promise<void> {
  for (let i = 0; i < parsedResumes.length; i++) {
    const parsed = parsedResumes[i];
    
    // 检查手机号是否重复
    if (parsed.phone) {
      const existing = await this.resumesRepository.findOne({
        where: { phone: parsed.phone, isDeleted: false },
      });
      
      if (existing) {
        console.log(`跳过重复简历: ${parsed.name}`);
        continue;
      }
    }
    
    // 第一个更新原记录，其他创建新记录
    let resume: Resume;
    if (i === 0) {
      resume = await this.updateFirstResume(originalResumeId, parsed);
    } else {
      resume = await this.createNewResume(parsed, filePath, jobId, userId);
    }
    
    console.log(`创建简历 ${i + 1}/${parsedResumes.length}: ${parsed.name}`);
  }
}
```

## 📝 使用方法

### API 调用

#### 基本用法

```bash
# 启用多简历检测
curl -X POST "http://localhost:3001/resumes/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@multi_resumes.pdf" \
  -F "detectMultiple=true"
```

#### 关联岗位

```bash
# 启用多简历检测 + 关联岗位
curl -X POST "http://localhost:3001/resumes/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@multi_resumes.pdf" \
  -F "detectMultiple=true" \
  -F "jobId=1"
```

#### 默认行为（不检测）

```bash
# 默认按单个简历处理
curl -X POST "http://localhost:3001/resumes/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@resume.pdf"
```

### 前端集成

```typescript
// 添加多简历检测选项
const [enableMultiDetection, setEnableMultiDetection] = useState(false);

const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('detectMultiple', enableMultiDetection ? 'true' : 'false');
  
  const response = await api.post('/resumes/upload', formData);
  
  if (response.data.parseStatus === 'success') {
    alert('简历上传成功！系统正在解析...');
  }
};

// UI 组件
<div>
  <input 
    type="file" 
    accept=".pdf,.docx,.txt"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    }}
  />
  
  <label>
    <input 
      type="checkbox"
      checked={enableMultiDetection}
      onChange={(e) => setEnableMultiDetection(e.target.checked)}
    />
    检测并拆分多个简历
  </label>
</div>
```

## 🎯 典型场景

### 场景 1: 招聘会现场合并简历

**情况**:
- 招聘会收集了 10 份纸质简历
- 扫描成一个 PDF 文件
- 需要批量录入系统

**解决方案**:
```bash
curl -X POST "http://localhost:3001/resumes/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@job_fair_resumes.pdf" \
  -F "detectMultiple=true" \
  -F "jobId=5"
```

**结果**:
- ✅ 自动识别 10 份简历
- ✅ 拆分成 10 条记录
- ✅ 全部关联到岗位 5
- ✅ 自动去重（如有重复）

### 场景 2: 邮件附件合并简历

**情况**:
- 收到一封邮件
- 附件包含 3 个应聘者的简历（Word 格式）
- 三人应聘同一岗位

**操作**:
1. 保存附件为 DOCX
2. 上传并启用多简历检测
3. 系统自动创建 3 条记录

### 场景 3: 批量导入历史简历

**情况**:
- 有一个包含多个简历的旧文件
- 需要迁移到新系统

**操作**:
```bash
# 批量处理多个文件
for file in *.pdf; do
  curl -X POST "http://localhost:3001/resumes/upload" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "file=@$file" \
    -F "detectMultiple=true"
done
```

## 💡 工作原理

### 判断标准

AI 根据以下特征判断是否为多份简历：

#### 强特征（高权重）
- ✅ 出现多个不同的姓名
- ✅ 出现多个不同的手机号
- ✅ 出现多个不同的邮箱地址
- ✅ 明显的简历分隔标记（页码、分割线等）

#### 弱特征（低权重）
- ⚠️ 多个教育背景（可能是同一人）
- ⚠️ 多个工作经历（可能是同一人）
- ⚠️ 不同的专业技能列表

#### 排除情况
- ❌ 同一人的履历更新版本
- ❌ 双语简历（中英文）
- ❌ 附件材料（推荐信、作品集等）

### 处理流程

```
1. 文本提取
   └─→ 使用 pdf-parse / mammoth 提取纯文本
   
2. AI 初步检测
   └─→ 快速判断：单个 or 多个
   
3. 如果是多个
   ├─→ AI 拆分内容
   ├─→ 分别解析每份简历
   └─→ 验证和去重
   
4. 创建记录
   ├─→ 第1份：更新原记录
   └─→ 第2-N份：创建新记录
   
5. 审计日志
   └─→ 记录多简历拆分操作
```

## ⚙️ 配置选项

### 启用条件

多简历检测在以下情况下启用：

```typescript
// API 参数
detectMultiple: true | 'true' | '1'

// 默认值
detectMultiple: false  // 为了向后兼容和性能考虑
```

### 性能参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 最大简历数 | 单个文件最多拆分数 | 20 |
| 超时时间 | AI 检测超时 | 30秒 |
| 文本长度限制 | 检测时只分析前N字符 | 4000 |

## 📊 性能考虑

### 处理时间

| 简历数量 | 检测时间 | 解析时间 | 总时间 |
|---------|---------|---------|--------|
| 1份 | 跳过 | ~2s | ~2s |
| 2-3份 | ~2s | ~4-6s | ~6-8s |
| 4-5份 | ~2s | ~8-12s | ~10-14s |
| 6-10份 | ~3s | ~15-25s | ~18-28s |

### API 调用成本

- **检测阶段**: 1次 API 调用（检测数量）
- **解析阶段**: 1次 API 调用（拆分并解析所有简历）
- **总计**: 2次 API 调用（无论多少份简历）

### 优化建议

1. **按需启用**
   - 只在确定可能有多份简历时启用
   - 默认关闭以提高性能

2. **异步处理**
   - 检测和拆分在后台异步完成
   - 用户立即得到响应

3. **批量上传**
   - 批量上传时建议关闭多简历检测
   - 每个文件单独处理会更可控

## 🐛 异常处理

### 1. 检测失败

**情况**: AI 检测简历数量失败

**处理**: 自动降级到单简历处理
```
[LOG] AI 检测简历数量失败: timeout
[LOG] 尝试按单个简历处理...
[LOG] 简历解析成功: 张三
```

### 2. 拆分失败

**情况**: AI 无法正确拆分多份简历

**处理**: 返回错误，保留原文件
```
[ERROR] 解析多份简历失败: 无法识别简历边界
[LOG] 文件已保存: /uploads/resumes/xxx.pdf
[提示] 请手动拆分文件后重新上传
```

### 3. 部分失败

**情况**: 10份简历中，2份解析失败

**处理**: 成功的记录已创建，失败的跳过
```
[LOG] 创建简历 1/10: 张三 ✅
[LOG] 创建简历 2/10: 李四 ✅
[ERROR] 创建简历 3/10 失败: 缺少必填字段 ❌
...
[LOG] 多简历处理完成: 成功 8/10
```

### 4. 全部重复

**情况**: 所有简历的手机号都已存在

**处理**: 全部跳过，不创建新记录
```
[LOG] 跳过重复简历: 张三 (手机号已存在)
[LOG] 跳过重复简历: 李四 (手机号已存在)
...
[LOG] 多简历处理完成: 成功 0/5（全部重复）
```

## 📈 统计和监控

### 审计日志

每次多简历处理都会记录详细日志：

```json
{
  "resumeId": 123,
  "action": "PARSE",
  "userId": 1,
  "details": {
    "multiResumeIndex": 2,
    "totalCount": 5,
    "name": "李四"
  },
  "createdAt": "2024-10-25T10:30:00Z"
}
```

### 查询统计

```sql
-- 查询多简历处理记录
SELECT 
  r.id,
  r.name,
  r.fileName,
  a.details->>'$.totalCount' as total_count,
  a.details->>'$.multiResumeIndex' as resume_index
FROM resumes r
JOIN resume_audit_logs a ON a.resume_id = r.id
WHERE a.details->>'$.totalCount' IS NOT NULL
ORDER BY a.created_at DESC;
```

## ✅ 测试建议

### 单元测试

```typescript
describe('Multiple Resume Detection', () => {
  it('should detect single resume', async () => {
    const result = await aiService.detectAndParseMultipleResumes('single.pdf');
    expect(result.isMultiple).toBe(false);
    expect(result.count).toBe(1);
  });

  it('should detect multiple resumes', async () => {
    const result = await aiService.detectAndParseMultipleResumes('multi.pdf');
    expect(result.isMultiple).toBe(true);
    expect(result.count).toBeGreaterThan(1);
  });

  it('should split and parse multiple resumes', async () => {
    const result = await aiService.detectAndParseMultipleResumes('three_resumes.pdf');
    expect(result.resumes).toHaveLength(3);
    expect(result.resumes[0].name).toBeDefined();
    expect(result.resumes[1].name).toBeDefined();
    expect(result.resumes[2].name).toBeDefined();
  });
});
```

### 集成测试

```typescript
describe('Resume Upload with Multi-Detection', () => {
  it('should create multiple records from one file', async () => {
    const response = await request(app.getHttpServer())
      .post('/resumes/upload')
      .attach('file', 'test/fixtures/multi_resumes.pdf')
      .field('detectMultiple', 'true')
      .expect(201);

    // 验证创建了多条记录
    const resumes = await resumeRepository.find({
      where: { filePath: response.body.filePath }
    });
    
    expect(resumes.length).toBeGreaterThan(1);
  });
});
```

## 🔮 未来改进

### 短期 (1-2周)
- [ ] 添加进度提示（正在处理第 X/N 份简历）
- [ ] 支持自定义最大简历数限制
- [ ] 优化 AI 提示词以提高准确率

### 中期 (1-2月)
- [ ] 前端显示多简历拆分结果
- [ ] 支持手动调整拆分结果
- [ ] 添加简历合并功能（反向操作）

### 长期 (3-6月)
- [ ] 机器学习模型优化检测
- [ ] 支持更复杂的文档结构
- [ ] 批量处理性能优化

## 📚 相关文档

- [AI 简历解析](./AI_RESUME_PARSING.md)
- [DOCX 格式支持](./DOCX_SUPPORT_UPGRADE.md)
- [简历管理功能](./RESUME_QUICK_START.md)
- [API 文档](../api/RESUME_API.md)

## 🎉 总结

多简历检测与拆分功能大幅提升了批量简历处理效率：

- ✅ 自动识别：无需手动拆分文件
- ✅ 智能处理：AI 准确拆分和解析
- ✅ 灵活控制：可选启用，按需使用
- ✅ 健壮性强：失败自动降级
- ✅ 完整审计：全程日志记录

**适用场景**: 招聘会、批量导入、合并文档处理
**建议**: 在确定文件包含多份简历时启用此功能

