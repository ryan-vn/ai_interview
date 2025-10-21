# AI 面试系统 - UI 设计规范

**版本**：v1.0  
**最后更新**：2025-10-21  
**适用范围**：AI 面试系统所有前端界面

---

## 目录
1. [设计原则](#1-设计原则)
2. [色彩系统](#2-色彩系统)
3. [字体系统](#3-字体系统)
4. [间距与布局系统](#4-间距与布局系统)
5. [组件规范](#5-组件规范)
6. [页面布局规范](#6-页面布局规范)
7. [交互与动效](#7-交互与动效)
8. [图标系统](#8-图标系统)
9. [状态反馈](#9-状态反馈)
10. [响应式设计](#10-响应式设计)
11. [无障碍设计](#11-无障碍设计)

---

## 1. 设计原则

### 1.1 核心设计理念
- **专业严谨**：系统用于技术面试，界面需传递专业、可信赖的感觉
- **简洁高效**：减少干扰，让用户专注于答题和评审
- **清晰反馈**：状态、进度、结果需清晰可见
- **一致性**：保持视觉和交互的统一性

### 1.2 设计目标
- **候选人视角**：降低紧张感，提供友好的答题环境
- **面试官视角**：高效查看和评审，快速做出判断
- **管理员视角**：便捷管理题库和系统配置

---

## 2. 色彩系统

### 2.1 主色调（Primary）
用于主要操作按钮、重要信息强调、导航激活状态

```
主色：#2563EB（蓝色 - Blue-600）
  - Light: #3B82F6 (hover)
  - Lighter: #60A5FA
  - Dark: #1D4ED8 (active)
  - Darker: #1E40AF
```

**应用场景**：
- 主要按钮（提交、确认）
- 链接
- 选中状态
- 进度条

### 2.2 辅助色（Secondary）
用于次要操作、辅助信息

```
辅助色：#64748B（灰蓝色 - Slate-500）
  - Light: #94A3B8
  - Dark: #475569
```

### 2.3 功能色（Functional Colors）

#### 成功色（Success）
```
成功：#10B981（绿色 - Green-500）
  - Light: #34D399
  - Dark: #059669
  - Background: #D1FAE5
```
**应用**：测试通过、提交成功、得分达标

#### 警告色（Warning）
```
警告：#F59E0B（橙色 - Amber-500）
  - Light: #FBBF24
  - Dark: #D97706
  - Background: #FEF3C7
```
**应用**：时间不足提醒、部分测试失败

#### 错误色（Error）
```
错误：#EF4444（红色 - Red-500）
  - Light: #F87171
  - Dark: #DC2626
  - Background: #FEE2E2
```
**应用**：测试失败、提交错误、验证失败

#### 信息色（Info）
```
信息：#3B82F6（蓝色 - Blue-500）
  - Light: #60A5FA
  - Dark: #2563EB
  - Background: #DBEAFE
```
**应用**：提示信息、帮助文档、系统通知

### 2.4 中性色（Neutral）
用于文本、边框、背景

```
中性色系（Gray）：
  - Gray-900: #111827 - 主标题
  - Gray-800: #1F2937 - 副标题
  - Gray-700: #374151 - 正文
  - Gray-600: #4B5563 - 次要文本
  - Gray-500: #6B7280 - 辅助文本
  - Gray-400: #9CA3AF - 占位符
  - Gray-300: #D1D5DB - 分割线
  - Gray-200: #E5E7EB - 边框
  - Gray-100: #F3F4F6 - 背景
  - Gray-50:  #F9FAFB - 页面背景
  - White:    #FFFFFF - 卡片背景
```

### 2.5 角色专属色（可选）

```
候选人主题：
  - 主色：#2563EB (蓝色 - 沉稳、专业)
  
面试官主题：
  - 主色：#7C3AED (紫色 - 权威、决策)
  
管理员主题：
  - 主色：#059669 (绿色 - 管理、系统)
```

### 2.6 代码编辑器色彩（Monaco Editor）
使用深色或浅色主题，推荐：
- **浅色模式**：VS Code Light+
- **深色模式**：One Dark Pro

---

## 3. 字体系统

### 3.1 字体家族

#### 系统字体（System Font Stack）
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 
             'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', 
             Helvetica, Arial, sans-serif;
```

#### 代码字体（Monospace）
```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 
             Consolas, 'Courier New', monospace;
```

#### 数字字体（Tabular）
用于表格、得分等需要对齐的场景
```css
font-variant-numeric: tabular-nums;
```

### 3.2 字体大小（Font Size）

```
特大标题：32px / 2rem     - 页面主标题
大标题：  24px / 1.5rem   - 模块标题
标题：    20px / 1.25rem  - 卡片标题
副标题：  18px / 1.125rem - 区块标题
正文：    16px / 1rem     - 主要内容（基准）
小字：    14px / 0.875rem - 辅助信息
微字：    12px / 0.75rem  - 说明文字
```

### 3.3 字重（Font Weight）

```
Regular:  400 - 正文
Medium:   500 - 强调
Semibold: 600 - 小标题
Bold:     700 - 标题
```

### 3.4 行高（Line Height）

```
紧凑：1.2  - 标题
正常：1.5  - 正文（默认）
宽松：1.75 - 大段文字
```

### 3.5 字体应用示例

```css
/* H1 - 页面主标题 */
.heading-1 {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

/* H2 - 模块标题 */
.heading-2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: #1F2937;
}

/* 正文 */
.body-text {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: #374151;
}

/* 代码 */
.code-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}
```

---

## 4. 间距与布局系统

### 4.1 间距单位（Spacing Scale）

采用 8px 基准的间距系统：

```
0:   0px
1:   4px   - 极小间距（图标与文字）
2:   8px   - 小间距（元素内部）
3:   12px  - 组件内间距
4:   16px  - 常规间距（卡片内边距）
5:   20px  - 中等间距
6:   24px  - 大间距（卡片外边距）
8:   32px  - 模块间距
10:  40px  - 区块间距
12:  48px  - 大区块间距
16:  64px  - 页面边距
20:  80px  - 特大间距
```

### 4.2 容器宽度（Container Width）

```
xs:  480px  - 手机
sm:  640px  - 小平板
md:  768px  - 平板
lg:  1024px - 笔记本
xl:  1280px - 桌面（默认最大宽度）
2xl: 1536px - 大屏幕
```

### 4.3 栅格系统（Grid System）

- 12列栅格
- Gutter: 24px（列间距）
- 响应式断点对齐容器宽度

### 4.4 卡片间距规范

```
卡片内边距（Padding）：24px
卡片间距（Gap）：      24px
卡片圆角（Radius）：   8px
```

---

## 5. 组件规范

### 5.1 按钮（Button）

#### 尺寸
```
Large:  高度 48px, 内边距 16px 32px, 字体 16px
Medium: 高度 40px, 内边距 12px 24px, 字体 14px (默认)
Small:  高度 32px, 内边距 8px 16px,  字体 14px
```

#### 类型

**主按钮（Primary）**
```
背景：#2563EB
文字：#FFFFFF
悬停：#3B82F6
按下：#1D4ED8
圆角：6px
```

**次要按钮（Secondary）**
```
背景：#FFFFFF
边框：#D1D5DB (1px)
文字：#374151
悬停：背景 #F9FAFB
圆角：6px
```

**危险按钮（Danger）**
```
背景：#EF4444
文字：#FFFFFF
悬停：#F87171
```

**文字按钮（Text）**
```
背景：transparent
文字：#2563EB
悬停：#3B82F6，背景 #EFF6FF
```

**禁用状态**
```
背景：#E5E7EB
文字：#9CA3AF
光标：not-allowed
```

#### 图标按钮
- 正方形，尺寸同高度
- 图标尺寸：16px（small）、20px（medium）、24px（large）

### 5.2 输入框（Input）

#### 基础样式
```
高度：40px
内边距：8px 12px
边框：1px solid #D1D5DB
圆角：6px
字体：16px
```

#### 状态
```
默认：边框 #D1D5DB
聚焦：边框 #2563EB, 阴影 0 0 0 3px rgba(37,99,235,0.1)
错误：边框 #EF4444, 阴影 0 0 0 3px rgba(239,68,68,0.1)
禁用：背景 #F3F4F6, 文字 #9CA3AF
```

#### 类型
- 文本输入
- 密码输入（带显示/隐藏切换）
- 数字输入
- 搜索输入（带搜索图标）
- 文本域（多行，高度 120px+）

### 5.3 下拉选择器（Select）

```
高度：40px
样式：同输入框
下拉菜单：
  - 背景：#FFFFFF
  - 阴影：0 4px 12px rgba(0,0,0,0.15)
  - 圆角：6px
  - 最大高度：320px（滚动）
  
选项：
  - 高度：40px
  - 内边距：8px 12px
  - 悬停：背景 #F3F4F6
  - 选中：背景 #EFF6FF, 文字 #2563EB
```

### 5.4 复选框与单选框

#### 复选框（Checkbox）
```
尺寸：18px × 18px
边框：2px solid #D1D5DB
圆角：4px
选中：背景 #2563EB, 白色勾选图标
```

#### 单选框（Radio）
```
尺寸：18px × 18px
边框：2px solid #D1D5DB
圆角：50%（圆形）
选中：边框 #2563EB, 内部圆点 6px #2563EB
```

### 5.5 开关（Switch）

```
宽度：44px
高度：24px
圆点：20px × 20px
背景（关）：#D1D5DB
背景（开）：#2563EB
过渡：all 0.3s
```

### 5.6 标签（Tag/Badge）

```
高度：24px
内边距：4px 8px
圆角：4px
字体：12px

类型：
  - 默认：背景 #F3F4F6, 文字 #374151
  - 成功：背景 #D1FAE5, 文字 #059669
  - 警告：背景 #FEF3C7, 文字 #D97706
  - 错误：背景 #FEE2E2, 文字 #DC2626
  - 信息：背景 #DBEAFE, 文字 #2563EB
```

### 5.7 进度条（Progress）

```
高度：8px
背景：#E5E7EB
圆角：4px
进度条：背景 #2563EB, 圆角 4px
过渡：width 0.3s ease
```

### 5.8 卡片（Card）

```
背景：#FFFFFF
边框：1px solid #E5E7EB (可选)
圆角：8px
内边距：24px
阴影：0 1px 3px rgba(0,0,0,0.1) (可选)

卡片标题：
  - 字体：18px, 600
  - 颜色：#1F2937
  - 下边距：16px
```

### 5.9 模态框（Modal）

```
遮罩层：
  - 背景：rgba(0,0,0,0.5)
  - 动画：fade in 0.2s
  
对话框：
  - 背景：#FFFFFF
  - 圆角：8px
  - 最大宽度：600px (small), 800px (medium), 1000px (large)
  - 阴影：0 20px 25px -5px rgba(0,0,0,0.1)
  - 内边距：24px
  
标题：
  - 字体：20px, 600
  - 下边距：16px
  
操作区：
  - 上边距：24px
  - 按钮右对齐
  - 按钮间距：12px
```

### 5.10 提示（Tooltip）

```
背景：#1F2937
文字：#FFFFFF
字体：14px
内边距：6px 12px
圆角：4px
阴影：0 4px 6px rgba(0,0,0,0.1)
箭头：6px
延迟：200ms
动画：fade + scale
```

### 5.11 提示框（Alert/Message）

```
高度：48px (最小)
内边距：12px 16px
圆角：6px
图标：20px (左侧)
关闭按钮：16px (右侧)

类型：
  - 成功：背景 #D1FAE5, 边框 #34D399, 图标/文字 #059669
  - 警告：背景 #FEF3C7, 边框 #FBBF24, 图标/文字 #D97706
  - 错误：背景 #FEE2E2, 边框 #F87171, 图标/文字 #DC2626
  - 信息：背景 #DBEAFE, 边框 #60A5FA, 图标/文字 #2563EB
```

### 5.12 表格（Table）

```
表头：
  - 背景：#F9FAFB
  - 字体：14px, 600
  - 颜色：#374151
  - 高度：48px
  - 内边距：12px 16px
  
行：
  - 高度：56px
  - 内边距：12px 16px
  - 边框：1px solid #E5E7EB (底部)
  - 悬停：背景 #F9FAFB
  
斑马纹（可选）：
  - 偶数行背景：#F9FAFB
```

### 5.13 分页（Pagination）

```
按钮：
  - 尺寸：32px × 32px
  - 圆角：4px
  - 间距：4px
  - 字体：14px
  
默认：
  - 背景：#FFFFFF
  - 边框：1px solid #D1D5DB
  - 文字：#374151
  
悬停：
  - 背景：#F3F4F6
  
当前页：
  - 背景：#2563EB
  - 文字：#FFFFFF
```

### 5.14 代码编辑器（Code Editor）

```
容器：
  - 背景：#1F2937
  - 圆角：8px
  - 最小高度：400px
  - 边框：1px solid #374151
  
工具栏：
  - 高度：48px
  - 背景：#111827
  - 内边距：8px 16px
  - 圆角：8px 8px 0 0
  
行号区：
  - 背景：#1A1F2E
  - 文字：#6B7280
  - 宽度：48px
  
编辑区：
  - 字体：'JetBrains Mono', monospace
  - 字体大小：14px
  - 行高：1.6
  - 内边距：16px
```

---

## 6. 页面布局规范

### 6.1 总体布局

采用经典的「顶部导航 + 侧边栏 + 主内容」三栏布局：

```
┌──────────────────────────────────────┐
│         Header (64px)                 │ 
├──────────┬───────────────────────────┤
│          │                           │
│ Sidebar  │    Main Content           │
│ (240px)  │                           │
│          │                           │
│          │                           │
└──────────┴───────────────────────────┘
```

### 6.2 顶部导航（Header）

```
高度：64px
背景：#FFFFFF
边框：1px solid #E5E7EB (底部)
阴影：0 1px 3px rgba(0,0,0,0.05)
内边距：0 24px

结构：
  - Logo (左侧, 32px高)
  - 主导航 (中间, 可选)
  - 用户信息 + 通知 + 设置 (右侧)
```

### 6.3 侧边栏（Sidebar）

```
宽度：240px
背景：#FFFFFF 或 #F9FAFB
边框：1px solid #E5E7EB (右侧)
内边距：16px

菜单项：
  - 高度：40px
  - 圆角：6px
  - 内边距：8px 12px
  - 图标：20px (左侧)
  - 间距：4px
  
默认：
  - 文字：#374151
  - 悬停：背景 #F3F4F6
  
激活：
  - 背景：#EFF6FF
  - 文字：#2563EB
  - 左侧指示条：3px #2563EB
```

### 6.4 主内容区（Main Content）

```
最小高度：calc(100vh - 64px)
背景：#F9FAFB
内边距：24px

内容容器：
  - 最大宽度：1280px (可根据需要调整)
  - 居中对齐
  - 背景：#FFFFFF (卡片化)
  - 内边距：24px
  - 圆角：8px
```

### 6.5 特定页面布局

#### 候选人答题页面
```
┌─────────────────────────────────────┐
│  题目信息栏 (倒计时、进度)            │ (64px)
├──────────────┬──────────────────────┤
│              │                      │
│ 题目描述     │   代码编辑器          │
│ (左侧 40%)   │   (右侧 60%)         │
│              │                      │
│              │   [运行] [提交]      │
└──────────────┴──────────────────────┘
```

#### 面试官评审页面
```
┌─────────────────────────────────────┐
│  候选人信息卡片                       │
├──────────────┬──────────────────────┤
│              │                      │
│ 题目列表     │   提交详情            │
│ (左侧 30%)   │   (右侧 70%)         │
│              │   - 代码/答案         │
│              │   - AI评分           │
│              │   - 评审区           │
└──────────────┴──────────────────────┘
```

---

## 7. 交互与动效

### 7.1 过渡时间（Transition Duration）

```
快速：150ms  - 按钮、链接悬停
正常：300ms  - 展开/收起、淡入淡出
缓慢：500ms  - 复杂动画、页面切换
```

### 7.2 缓动函数（Easing）

```
ease-in:     cubic-bezier(0.4, 0, 1, 1)      - 加速
ease-out:    cubic-bezier(0, 0, 0.2, 1)      - 减速 (常用)
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)    - 加速后减速
```

### 7.3 常用动效

#### 按钮点击
```css
.button {
  transition: all 150ms ease-out;
}
.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}
.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}
```

#### 卡片悬停
```css
.card {
  transition: box-shadow 300ms ease-out;
}
.card:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
```

#### 加载动画
- 骨架屏（Skeleton）：渐变波浪效果
- 旋转加载器：360度旋转，1s
- 进度条：从左到右填充

#### 页面切换
- 淡入淡出（fade）
- 滑动（slide）
- 缩放（scale）

### 7.4 微交互

- **输入聚焦**：平滑的边框颜色过渡 + 阴影出现
- **复选框选中**：勾选动画（✓ 绘制）
- **开关切换**：圆点滑动 + 背景色渐变
- **消息通知**：从顶部滑入
- **删除操作**：淡出 + 高度收缩

---

## 8. 图标系统

### 8.1 图标库选择

推荐使用：
- **Heroicons** (优先，与 Tailwind CSS 配套)
- **Lucide Icons** (备选，更丰富)
- **Ant Design Icons** (如使用 Ant Design)

### 8.2 图标尺寸

```
xs:  12px - 极小装饰
sm:  16px - 按钮内、行内
md:  20px - 菜单、列表
lg:  24px - 标题、工具栏
xl:  32px - 大图标
2xl: 48px - 空状态、引导页
```

### 8.3 常用图标映射

```
通用：
  - 首页：Home
  - 搜索：Search / MagnifyingGlass
  - 设置：Cog / Settings
  - 用户：User
  - 退出：ArrowRightOnRectangle / Logout
  - 通知：Bell
  
编辑：
  - 编辑：Pencil
  - 删除：Trash
  - 添加：Plus
  - 保存：Check / Save
  - 取消：XMark / Close
  
状态：
  - 成功：CheckCircle
  - 警告：ExclamationTriangle
  - 错误：XCircle
  - 信息：InformationCircle
  
操作：
  - 下载：ArrowDownTray
  - 上传：ArrowUpTray
  - 刷新：ArrowPath
  - 复制：DocumentDuplicate
  - 分享：Share
  
面试系统专用：
  - 编程题：CodeBracket
  - 问答题：ChatBubbleLeftRight
  - 计时器：Clock
  - 报告：DocumentText
  - 题库：BookOpen
  - 评分：Star
```

### 8.4 图标使用规范

- 保持图标与文字基线对齐
- 图标与文字间距：8px
- 图标颜色继承文字颜色
- 可点击图标增加悬停效果

---

## 9. 状态反馈

### 9.1 加载状态

#### 全局加载
```
遮罩层 + 居中加载器
背景：rgba(255,255,255,0.8)
加载器：旋转圆环 32px
```

#### 局部加载
```
骨架屏（Skeleton）：
  - 背景：#E5E7EB
  - 动画：渐变波浪从左到右
  - 应用：卡片、列表、表格
```

#### 按钮加载
```
按钮禁用 + 旋转图标（左侧）
文字：「提交中...」
```

### 9.2 空状态（Empty State）

```
图标：48px (灰色)
标题：16px, 「暂无数据」
描述：14px, 辅助说明
操作：按钮（可选，如「添加题目」）

居中显示
```

### 9.3 错误状态

```
全局错误：
  - 错误页面（404、500）
  - 大图标 + 错误码 + 说明 + 返回按钮
  
表单错误：
  - 输入框红色边框
  - 下方错误提示文字（12px, 红色）
  
操作失败：
  - Toast 消息提示
  - 类型：error
  - 位置：顶部居中或右上角
  - 持续时间：3-5秒
```

### 9.4 成功反馈

```
Toast 消息：
  - 类型：success
  - 图标：CheckCircle
  - 文字：「提交成功」
  - 持续时间：2-3秒
  
或页面跳转 + 确认动画
```

### 9.5 消息通知（Notification）

```
位置：右上角
宽度：320px
阴影：0 10px 25px rgba(0,0,0,0.15)
动画：从右侧滑入
堆叠：多条通知纵向排列

结构：
  - 图标（左侧）
  - 标题 + 内容（中间）
  - 关闭按钮（右侧）
  - 操作按钮（底部，可选）
```

---

## 10. 响应式设计

### 10.1 断点（Breakpoints）

```
sm:  640px  - 手机横屏、小平板
md:  768px  - 平板
lg:  1024px - 笔记本
xl:  1280px - 桌面
2xl: 1536px - 大屏幕
```

### 10.2 布局适配

#### 桌面（≥1024px）
- 三栏布局（Header + Sidebar + Main）
- 侧边栏固定显示
- 表格完整展示

#### 平板（768px - 1023px）
- 侧边栏折叠为汉堡菜单
- 主内容区占据全宽
- 表格保持响应式（可横向滚动）

#### 手机（< 768px）
- 顶部导航简化
- 侧边栏抽屉式展开
- 卡片纵向堆叠
- 表格转换为卡片展示
- 按钮全宽
- 代码编辑器减少内边距

### 10.3 组件响应式

#### 按钮
```
Desktop: Medium (40px)
Mobile:  Large (48px, 便于触控)
```

#### 输入框
```
Desktop: 40px
Mobile:  48px (防止页面缩放)
字体：  16px (iOS 防缩放)
```

#### 模态框
```
Desktop: 固定宽度 (600px)
Mobile:  全屏 (占据 100% 视口)
```

### 10.4 字体响应式

```css
/* 桌面 */
h1: 32px
h2: 24px
body: 16px

/* 移动端 */
h1: 28px
h2: 20px
body: 16px (保持不变)
```

---

## 11. 无障碍设计

### 11.1 色彩对比度

遵循 WCAG 2.1 AA 标准：
- 正常文本：对比度 ≥ 4.5:1
- 大文本（18px+ 或 14px+ 粗体）：对比度 ≥ 3:1
- 图标/UI组件：对比度 ≥ 3:1

### 11.2 键盘导航

- 所有交互元素可通过 Tab 键访问
- 聚焦状态清晰可见（焦点环）
- 支持 Enter/Space 触发按钮
- 支持 Esc 关闭模态框

```css
/* 聚焦样式 */
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}
```

### 11.3 语义化 HTML

- 使用正确的标签（button、nav、main、article 等）
- 表单字段关联 label
- 图标添加 aria-label
- 动态内容使用 aria-live

### 11.4 屏幕阅读器支持

- 重要操作添加 aria 属性
- 图标按钮添加说明文字
- 错误信息与表单字段关联
- 加载状态添加 aria-busy

---

## 附录

### A. 设计资源

**Figma 设计稿结构**：
```
├── 00-Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Components
├── 01-候选人界面
│   ├── 登录/注册
│   ├── 面试大厅
│   ├── 答题页面
│   └── 结果页面
├── 02-面试官界面
│   ├── 候选人列表
│   ├── 评审页面
│   └── 报告生成
└── 03-管理员界面
    ├── 题库管理
    ├── 用户管理
    └── 系统设置
```

### B. 代码实现建议

#### Tailwind CSS 配置示例
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // 主色
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        // 8px 基准
      },
      borderRadius: {
        DEFAULT: '6px',
        'card': '8px',
      },
    },
  },
};
```

### C. 命名规范

#### CSS 类名（BEM）
```
Block__Element--Modifier

示例：
.interview-card
.interview-card__title
.interview-card__title--highlight
.btn
.btn--primary
.btn--large
```

#### 组件命名
```
PascalCase：UserCard, InterviewList, CodeEditor
```

### D. 检查清单

设计交付前检查：
- [ ] 色彩对比度符合标准
- [ ] 所有状态有明确设计（默认、悬停、按下、禁用等）
- [ ] 响应式适配完整
- [ ] 加载/空状态/错误状态完整
- [ ] 图标统一且语义清晰
- [ ] 间距符合 8px 基准
- [ ] 字体大小/行高适配良好
- [ ] 交互反馈及时清晰
- [ ] 无障碍设计达标

---

**版本历史**：
- v1.0 (2025-10-21) - 初始版本

**维护说明**：
本规范为活文档，随项目迭代持续更新。所有设计变更需经过团队评审并同步更新此文档。

