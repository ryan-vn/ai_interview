# DOCX 格式支持升级

## 更新时间
2024-10-25

## 概述
为简历导入功能添加了 DOCX 格式支持，用户现在可以直接上传 Microsoft Word (DOCX) 格式的简历文件。

## 变更内容

### 1. 新增依赖

**安装的库**:
```bash
pnpm add mammoth
```

**mammoth 库说明**:
- 用于从 DOCX 文件中提取纯文本内容
- 支持 .docx 格式（Microsoft Word 2007+）
- 不支持旧版 .doc 格式（需要转换）

### 2. 代码修改

#### backend/src/ai/ai.service.ts

**新增导入**:
```typescript
import * as mammoth from 'mammoth';
```

**修改文件提取逻辑**:
```typescript
else if (ext === 'docx') {
  // DOCX 格式 - 使用 mammoth 提取文本
  this.logger.log('正在提取 DOCX 文件内容...');
  const result = await mammoth.extractRawText({ path: filePath });
  const extractedText = result.value || '';
  
  if (!extractedText || extractedText.trim().length === 0) {
    this.logger.warn('DOCX 文本提取结果为空');
    throw new Error('DOCX 文件内容为空或无法提取文本');
  }
  
  this.logger.log(`成功提取 DOCX 文本，长度: ${extractedText.length} 字符`);
  return extractedText;
}
```

**DOC 格式处理**:
```typescript
else if (ext === 'doc') {
  // DOC 格式（旧格式）- 建议转换
  this.logger.warn('检测到旧版 DOC 格式，建议转换为 DOCX 或 PDF');
  throw new Error('暂不支持旧版 DOC 格式，请将文件转换为 DOCX 或 PDF 后重新上传。\n提示：可使用 Microsoft Word 或 WPS 打开后另存为 DOCX 格式。');
}
```

### 3. 支持的文件格式

| 格式 | 状态 | 说明 |
|------|------|------|
| PDF | ✅ 支持 | 使用 pdf-parse 库 |
| TXT | ✅ 支持 | 直接读取文本 |
| DOCX | ✅ 支持 | 使用 mammoth 库（新增） |
| DOC | ⚠️ 部分支持 | 提示用户转换为 DOCX 或 PDF |
| JSON | ✅ 支持 | 用于测试 |

## 使用示例

### 上传 DOCX 简历

#### API 调用
```bash
curl -X POST "http://localhost:3001/resumes/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@resume.docx" \
  -F "jobId=1"
```

#### 前端上传
```typescript
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('jobId', '1');

  const response = await api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('上传成功:', response.data);
};

// 使用
<input 
  type="file" 
  accept=".pdf,.doc,.docx,.txt,.json"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }}
/>
```

### 批量上传
```bash
curl -X POST "http://localhost:3001/resumes/batch-upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@resume1.docx" \
  -F "files=@resume2.docx" \
  -F "files=@resume3.pdf" \
  -F "jobId=1"
```

## 处理流程

```
DOCX 文件上传
    ↓
保存到服务器 (uploads/resumes/)
    ↓
extractTextFromFile() 识别为 .docx 文件
    ↓
mammoth.extractRawText() 提取纯文本
    ↓
AI Service (DeepSeek) 解析简历结构
    ↓
保存到数据库（JSON格式）
    ↓
返回解析结果
```

## 技术细节

### mammoth 库工作原理

1. **读取 DOCX 文件**
   - DOCX 是基于 XML 的压缩文件格式
   - mammoth 解压并解析 XML 结构

2. **提取文本内容**
   ```typescript
   const result = await mammoth.extractRawText({ path: filePath });
   // result.value: 提取的纯文本
   // result.messages: 警告或错误信息
   ```

3. **输出格式**
   - 纯文本，不包含格式信息
   - 保留段落结构
   - 去除样式、图片等非文本内容

### 与 PDF 提取的对比

| 特性 | PDF (pdf-parse) | DOCX (mammoth) |
|------|-----------------|----------------|
| 文本提取准确度 | 高 | 非常高 |
| 格式保留 | 无 | 段落保留 |
| 表格处理 | 一般 | 良好 |
| 图片 | 不提取 | 不提取 |
| 扫描件支持 | 需OCR | 不适用 |
| 处理速度 | 快 | 快 |

## 错误处理

### 常见错误

**1. 文件为空**
```
错误: DOCX 文件内容为空或无法提取文本
原因: DOCX 文件损坏或不包含文本内容
解决: 检查文件是否正常，重新保存后上传
```

**2. 旧版 DOC 格式**
```
错误: 暂不支持旧版 DOC 格式
原因: 上传的是 .doc 而不是 .docx
解决: 使用 Word/WPS 打开后另存为 DOCX 格式
```

**3. 文件损坏**
```
错误: 提取文件文本失败
原因: DOCX 文件结构损坏
解决: 重新创建或修复文件
```

### 日志记录

```typescript
// 成功提取
this.logger.log('正在提取 DOCX 文件内容...');
this.logger.log('成功提取 DOCX 文本，长度: 1234 字符');

// 提取失败
this.logger.warn('DOCX 文本提取结果为空');
this.logger.error('提取文件文本失败: [错误信息]');
```

## 性能考虑

### 处理时间

| 文件大小 | 提取时间 | AI解析时间 | 总时间 |
|---------|----------|-----------|--------|
| < 100KB | ~100ms | ~2s | ~2.1s |
| 100KB-500KB | ~200ms | ~2-3s | ~2.5s |
| 500KB-1MB | ~500ms | ~3-4s | ~4s |
| > 1MB | ~1s | ~4-5s | ~6s |

### 优化建议

1. **文件大小限制**
   ```typescript
   // 在 multer 配置中限制文件大小
   limits: {
     fileSize: 5 * 1024 * 1024, // 5MB
   }
   ```

2. **异步处理**
   - 对于批量上传，考虑使用队列异步处理
   - 避免同时处理过多文件导致内存压力

3. **错误恢复**
   - 提供"重新解析"功能
   - 保留原始文件供重试

## 测试建议

### 单元测试

```typescript
describe('DOCX File Extraction', () => {
  it('should extract text from valid DOCX', async () => {
    const filePath = './test-files/resume.docx';
    const result = await aiService.parseResume(filePath);
    
    expect(result.name).toBeDefined();
    expect(result.skills.length).toBeGreaterThan(0);
  });

  it('should throw error for empty DOCX', async () => {
    const filePath = './test-files/empty.docx';
    
    await expect(aiService.parseResume(filePath))
      .rejects
      .toThrow('DOCX 文件内容为空');
  });

  it('should throw error for old DOC format', async () => {
    const filePath = './test-files/old-format.doc';
    
    await expect(aiService.parseResume(filePath))
      .rejects
      .toThrow('暂不支持旧版 DOC 格式');
  });
});
```

### 集成测试

```typescript
describe('Resume Upload with DOCX', () => {
  it('should upload and parse DOCX resume', async () => {
    const response = await request(app.getHttpServer())
      .post('/resumes/upload')
      .attach('file', './test-files/resume.docx')
      .field('jobId', '1')
      .expect(201);

    expect(response.body.name).toBeDefined();
    expect(response.body.parseStatus).toBe('success');
  });
});
```

## 兼容性

### 浏览器支持
- ✅ Chrome/Edge (所有版本)
- ✅ Firefox (所有版本)
- ✅ Safari (所有版本)

### Word 版本支持
- ✅ Microsoft Word 2007+ (.docx)
- ✅ WPS Office (兼容格式)
- ✅ Google Docs (导出为 DOCX)
- ✅ LibreOffice Writer (DOCX 格式)
- ⚠️ Microsoft Word 97-2003 (.doc) - 需转换

## 用户指南

### 如何转换旧版 DOC 为 DOCX

**方法一: 使用 Microsoft Word**
1. 打开 .doc 文件
2. 点击"文件" → "另存为"
3. 在"保存类型"中选择"Word 文档 (*.docx)"
4. 点击"保存"

**方法二: 使用 WPS Office**
1. 打开 .doc 文件
2. 点击"文件" → "另存为"
3. 选择格式为 "Word 2007-2019 文档 (*.docx)"
4. 保存

**方法三: 在线转换**
- 使用 CloudConvert (https://cloudconvert.com/)
- 使用 Zamzar (https://www.zamzar.com/)
- 上传 DOC 文件，选择转换为 DOCX

### 上传 DOCX 简历的最佳实践

1. **文件命名**
   - 使用有意义的文件名：`张三_前端开发_3年经验.docx`
   - 避免特殊字符和空格

2. **内容格式**
   - 使用标准简历模板
   - 清晰的段落结构
   - 避免使用复杂的表格和图形

3. **文件大小**
   - 建议小于 5MB
   - 压缩或删除不必要的图片

4. **内容完整性**
   - 确保包含联系方式
   - 清晰列出技能和经验
   - 使用标准的日期格式

## 后续优化方向

### 短期 (1-2周)

1. **支持旧版 DOC 格式**
   ```bash
   # 可以使用 textract 库
   npm install textract
   ```

2. **添加文件预览**
   - 在解析前显示文件预览
   - 用户确认后再解析

3. **优化错误提示**
   - 更友好的错误信息
   - 提供具体的解决方案

### 中期 (1-2月)

1. **格式保留**
   - 提取部分格式信息（加粗、列表等）
   - 更好地识别简历结构

2. **表格提取**
   - 识别简历中的表格
   - 结构化提取表格数据

3. **多语言支持**
   - 支持英文简历
   - 支持其他语言简历

### 长期 (3-6月)

1. **智能模板识别**
   - 识别不同的简历模板
   - 针对性提取信息

2. **图片文字识别**
   - 提取 DOCX 中的图片
   - OCR 识别图片中的文字

3. **版本比对**
   - 比对不同版本的简历
   - 高亮显示变更内容

## 相关文档

- [简历功能需求检查](./RESUME_REQUIREMENTS_CHECK.md)
- [AI 简历解析功能](./AI_RESUME_PARSING.md)
- [简历管理功能](./RESUME_QUICK_START.md)

## 更新日志

- 2024-10-25: 初始版本，添加 DOCX 格式支持
- 2024-10-25: 优化错误提示，区分 DOC 和 DOCX 格式

