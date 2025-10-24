# 导入按钮修复说明

## 问题描述

简历管理页面的导入按钮点击后没有任何反应。

## 原因分析

问题出在 `Button` 组件的使用方式上。代码中使用了 `<Button as="span">`，但 shadcn/ui 的 Button 组件不支持 `as` 属性。

### 错误代码
```tsx
<label>
  <input type="file" style={{ display: 'none' }} />
  <Button as="span">导入单个</Button>  {/* ❌ Button 不支持 as 属性 */}
</label>
```

### Button 组件实际支持的属性

shadcn/ui 的 Button 组件支持的是 `asChild` 属性（来自 Radix UI），而不是 `as`：

```tsx
export interface ButtonProps {
  asChild?: boolean  // ✅ 支持 asChild
  // 但不支持 as
}
```

## 解决方案

使用 React `useRef` 来引用隐藏的 input 元素，然后在 Button 的 onClick 中触发它：

### 修复后的代码

```tsx
import { useRef } from 'react';

export default function ResumesPage() {
  // 创建 ref
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* 隐藏的 input 元素 */}
      <input
        ref={singleFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.json"
        onChange={handleFileUpload}
        disabled={uploadingFile}
        style={{ display: 'none' }}
      />
      
      {/* 点击按钮时触发 input */}
      <Button
        onClick={() => singleFileInputRef.current?.click()}
        disabled={uploadingFile}
      >
        📄 导入单个
      </Button>

      {/* 批量导入 */}
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
        📦 批量导入
      </Button>
    </>
  );
}
```

## 其他修复

同时修复了该文件中的错误处理方式，统一使用新的响应格式：

### 修复前
```tsx
catch (error: any) {
  alert(error.response?.data?.message || '上传失败');
}
```

### 修复后
```tsx
catch (error: any) {
  alert(error.message || '上传失败');
}
```

## 修复的文件

- **`frontend/app/admin/resumes/page.tsx`**
  - ✅ 修复导入按钮（使用 useRef 替代 Button as="span"）
  - ✅ 修复 4 处错误处理（统一使用 error.message）
  - ✅ 添加 useRef import

## 测试验证

1. **单个导入按钮**
   - 点击 "📄 导入单个" 按钮
   - 应该弹出文件选择对话框
   - 选择 PDF/DOC 文件后应该正常上传

2. **批量导入按钮**
   - 点击 "📦 批量导入" 按钮
   - 应该弹出文件选择对话框（支持多选）
   - 选择多个文件后应该批量上传

3. **错误处理**
   - 上传失败时应该显示正确的错误信息
   - 不再显示 undefined 或空白 alert

## 最佳实践

在 React 中处理文件上传时，推荐的做法：

1. **使用 useRef** - 引用隐藏的 input 元素
2. **触发点击** - 在按钮的 onClick 中调用 `inputRef.current?.click()`
3. **避免 label 包裹** - label + hidden input 的方式在某些框架中可能有兼容性问题

## 相关文档

- [前端错误处理修复说明](./FRONTEND_ERROR_HANDLING_FIX.md)
- [API 响应格式规范](./API_RESPONSE_FORMAT.md)
- [shadcn/ui Button 文档](https://ui.shadcn.com/docs/components/button)

