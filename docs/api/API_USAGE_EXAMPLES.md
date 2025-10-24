# API 使用示例

本文档提供了使用统一响应格式的实际代码示例。

## 前端使用示例

### 1. 用户登录

```typescript
// components/LoginForm.tsx
import { authApi } from '@/lib/api';
import { useState } from 'react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 直接使用 response.data，无需 response.data.data
      const response = await authApi.login({ username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      console.log('登录成功:', user);
      window.location.href = '/dashboard';
    } catch (err: any) {
      // 错误信息已经在拦截器中处理
      setError(err.message || '登录失败');
      
      // 如果有验证错误
      if (err.errors) {
        console.error('验证错误:', err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="用户名"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

### 2. 获取题目列表

```typescript
// pages/questions/index.tsx
import { questionsApi } from '@/lib/api';
import { useEffect, useState } from 'react';

interface Question {
  id: number;
  title: string;
  difficulty: string;
  type: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // response.data 直接是题目数组
      const response = await questionsApi.getAll({ difficulty: 'medium' });
      setQuestions(response.data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h1>题目列表</h1>
      {questions.map(q => (
        <div key={q.id}>
          <h3>{q.title}</h3>
          <span>{q.difficulty}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. 创建新题目（带验证错误处理）

```typescript
// components/CreateQuestionForm.tsx
import { questionsApi } from '@/lib/api';
import { useState } from 'react';

export function CreateQuestionForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'coding',
    difficulty: 'medium',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);

    try {
      const response = await questionsApi.create(formData);
      console.log('创建成功:', response.data);
      setSuccess(true);
      // 重置表单
      setFormData({ title: '', content: '', type: 'coding', difficulty: 'medium' });
    } catch (err: any) {
      // 显示主错误信息
      if (err.message) {
        setErrors([err.message]);
      }
      
      // 如果有详细的验证错误
      if (err.errors && Array.isArray(err.errors)) {
        setErrors(err.errors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {success && <div className="success">创建成功！</div>}
      
      {errors.length > 0 && (
        <div className="error">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="题目标题"
      />
      
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="题目内容"
      />
      
      <button type="submit">创建题目</button>
    </form>
  );
}
```

### 4. 使用 TypeScript 类型

```typescript
// types/api.ts
import { ApiResponse } from '@/lib/api';

// 定义业务数据类型
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface Question {
  id: number;
  title: string;
  content: string;
  type: string;
  difficulty: string;
  tags: string[];
  createdAt: string;
}

// 在组件中使用
const handleLogin = async () => {
  try {
    // TypeScript 会知道 response.data 的类型
    const response = await authApi.login({ username, password });
    const data: LoginResponse = response.data;
    
    // 类型安全的访问
    console.log(data.user.username);
    console.log(data.token);
  } catch (err: any) {
    console.error(err.message);
  }
};
```

## 后端使用示例

### 1. 简单的控制器

```typescript
// questions.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // 直接返回数据，拦截器会自动包装
  @Get()
  async findAll() {
    return this.questionsService.findAll();
    // 自动返回: { code: 0, message: 'success', data: [...], timestamp: ... }
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.questionsService.findOne(id);
    // 自动返回: { code: 0, message: 'success', data: {...}, timestamp: ... }
  }

  @Post()
  async create(@Body() createDto: CreateQuestionDto) {
    return this.questionsService.create(createDto);
    // 自动返回: { code: 0, message: 'success', data: {...}, timestamp: ... }
  }
}
```

### 2. 抛出异常

```typescript
// questions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class QuestionsService {
  async findOne(id: number) {
    const question = await this.questionRepository.findOne({ where: { id } });
    
    if (!question) {
      // 抛出异常，异常过滤器会自动格式化
      throw new NotFoundException(`题目 #${id} 不存在`);
      // 自动返回: { code: 404, message: '题目 #1 不存在', data: null, ... }
    }
    
    return question;
  }

  async create(createDto: CreateQuestionDto) {
    // 业务验证
    if (await this.isDuplicate(createDto.title)) {
      throw new BadRequestException('题目标题已存在');
      // 自动返回: { code: 400, message: '题目标题已存在', data: null, ... }
    }
    
    return this.questionRepository.save(createDto);
  }
}
```

### 3. 自定义错误信息

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    
    return {
      token: this.jwtService.sign({ sub: user.id, username: user.username }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
```

### 4. DTO 验证

```typescript
// dto/create-question.dto.ts
import { IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: '题目标题不能为空' })
  @MinLength(5, { message: '题目标题至少需要5个字符' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '题目内容不能为空' })
  content: string;

  @IsEnum(['coding', 'multiple-choice', 'open-ended'], {
    message: '题目类型必须是: coding, multiple-choice 或 open-ended',
  })
  type: string;

  @IsEnum(['easy', 'medium', 'hard'], {
    message: '难度必须是: easy, medium 或 hard',
  })
  difficulty: string;
}

// 当验证失败时，自动返回:
// {
//   "code": 400,
//   "message": "Validation failed",
//   "data": null,
//   "errors": [
//     "题目标题不能为空",
//     "题目内容不能为空",
//     "题目类型必须是: coding, multiple-choice 或 open-ended"
//   ],
//   "timestamp": 1698765432100
// }
```

## 高级用法

### 1. 自定义错误处理

```typescript
// 前端自定义错误处理
const handleApiCall = async <T>(apiCall: Promise<any>): Promise<T | null> => {
  try {
    const response = await apiCall;
    return response.data as T;
  } catch (err: any) {
    // 统一的错误处理
    console.error('API Error:', {
      code: err.code,
      message: err.message,
      errors: err.errors,
      status: err.status,
    });
    
    // 显示用户友好的错误信息
    if (err.code === 401) {
      alert('登录已过期，请重新登录');
    } else if (err.code === 403) {
      alert('您没有权限执行此操作');
    } else if (err.errors) {
      alert(err.errors.join('\n'));
    } else {
      alert(err.message || '操作失败');
    }
    
    return null;
  }
};

// 使用
const questions = await handleApiCall<Question[]>(
  questionsApi.getAll()
);

if (questions) {
  console.log('获取到的题目:', questions);
}
```

### 2. React Hook 封装

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  options?: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(...args);
      setData(response.data);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || '请求失败');
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options]);

  return { data, loading, error, execute };
}

// 使用
function QuestionsPage() {
  const { data: questions, loading, error, execute } = useApi(
    questionsApi.getAll,
    {
      onSuccess: (data) => console.log('加载成功:', data),
      onError: (err) => console.error('加载失败:', err),
    }
  );

  useEffect(() => {
    execute({ difficulty: 'medium' });
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return <div>{/* 渲染 questions */}</div>;
}
```

## 测试示例

### 后端单元测试

```typescript
// questions.service.spec.ts
describe('QuestionsService', () => {
  it('should throw NotFoundException when question not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
```

### 前端测试

```typescript
// LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { authApi } from '@/lib/api';

jest.mock('@/lib/api');

describe('LoginForm', () => {
  it('should handle successful login', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, username: 'test' }
      }
    };
    
    (authApi.login as jest.Mock).mockResolvedValue(mockResponse);
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByPlaceholderText('用户名'), {
      target: { value: 'test' }
    });
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'password' }
    });
    fireEvent.click(screen.getByText('登录'));
    
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('test-token');
    });
  });
  
  it('should handle login error', async () => {
    const mockError = { message: '用户名或密码错误', code: 401 };
    (authApi.login as jest.Mock).mockRejectedValue(mockError);
    
    render(<LoginForm />);
    
    fireEvent.click(screen.getByText('登录'));
    
    await waitFor(() => {
      expect(screen.getByText('用户名或密码错误')).toBeInTheDocument();
    });
  });
});
```

## 总结

统一的响应格式让代码更加简洁和一致：

- ✅ 后端只需关注业务逻辑，返回数据即可
- ✅ 前端直接使用 `response.data` 访问业务数据
- ✅ 错误处理统一且类型安全
- ✅ 支持验证错误的详细信息
- ✅ 自动处理常见场景（如 401 跳转）

