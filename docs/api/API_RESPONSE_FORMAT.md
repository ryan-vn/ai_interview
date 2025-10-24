# API 统一响应格式规范

## 概述

本系统实现了统一的API响应格式，所有接口返回的数据都遵循相同的结构，便于前端统一处理。

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 实际业务数据
  },
  "timestamp": 1698765432100
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误描述信息",
  "data": null,
  "errors": null,
  "timestamp": 1698765432100
}
```

### 验证错误响应

```json
{
  "code": 400,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "username should not be empty",
    "email must be an email"
  ],
  "timestamp": 1698765432100
}
```

## 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 状态码，0 表示成功，其他值表示错误（通常为HTTP状态码） |
| `message` | string | 提示信息，成功时为 "success"，失败时为具体错误信息 |
| `data` | any | 实际业务数据，成功时包含请求的数据，失败时为 null |
| `errors` | any | 详细错误信息（如验证错误），可选字段 |
| `timestamp` | number | 时间戳（毫秒） |

## 后端实现

### 1. 响应拦截器

位置：`backend/src/common/interceptors/transform.interceptor.ts`

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
        timestamp: Date.now(),
      })),
    );
  }
}
```

### 2. 异常过滤器

位置：`backend/src/common/filters/http-exception.filter.ts`

统一处理所有异常，包括：
- HTTP 异常
- 验证错误
- 系统错误

### 3. 注册到应用

位置：`backend/src/main.ts`

```typescript
// 全局响应拦截器 - 统一返回格式
app.useGlobalInterceptors(new TransformInterceptor());

// 全局异常过滤器 - 统一错误格式
app.useGlobalFilters(new HttpExceptionFilter());
```

## 前端处理

### 1. Axios 响应拦截器

位置：`frontend/lib/api.ts`

前端的 axios 已经配置了响应拦截器，自动处理统一格式：

```typescript
api.interceptors.response.use(
  (response) => {
    // 成功时，自动提取 data 字段
    const apiResponse = response.data as ApiResponse;
    if (apiResponse.code === 0) {
      response.data = apiResponse.data;
      return response;
    }
    // 业务错误
    return Promise.reject(new Error(apiResponse.message));
  },
  (error: AxiosError) => {
    // HTTP 错误处理
    // ...
  }
);
```

### 2. 业务代码使用示例

#### 基本使用

```typescript
// 使用 async/await
try {
  const response = await authApi.login({ username: 'test', password: '123456' });
  // response.data 直接是业务数据，不需要再 .data.data
  console.log(response.data); // { token: 'xxx', user: {...} }
} catch (error: any) {
  // error.message 是错误信息
  console.error(error.message);
  // error.code 是错误码
  console.error(error.code);
  // error.errors 是详细错误（如验证错误）
  console.error(error.errors);
}
```

#### 在 React 组件中使用

```typescript
const handleLogin = async () => {
  try {
    const response = await authApi.login({ username, password });
    // 直接使用 response.data
    localStorage.setItem('token', response.data.token);
    router.push('/dashboard');
  } catch (error: any) {
    // 显示错误信息
    alert(error.message || '登录失败');
    
    // 如果是验证错误，可以显示详细信息
    if (error.errors) {
      setValidationErrors(error.errors);
    }
  }
};
```

## 状态码规范

| 状态码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误或验证失败 |
| 401 | 未授权（未登录或 token 无效） |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| -1 | 网络错误（前端特有） |

## 特殊处理

### 401 自动跳转

当接口返回 401 状态码时，前端会自动：
1. 清除本地存储的 token
2. 跳转到登录页面

```typescript
if (error.response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

## 注意事项

1. **后端开发者**：
   - 控制器方法直接返回业务数据即可，不需要手动包装
   - 抛出异常时使用 NestJS 的标准异常类（如 `HttpException`）
   - 验证错误会自动被捕获并格式化

2. **前端开发者**：
   - 使用 `response.data` 直接访问业务数据
   - 在 catch 块中通过 `error.message`、`error.code`、`error.errors` 访问错误信息
   - 不需要检查 `code === 0`，这在拦截器中已经处理

3. **类型安全**：
   - 前端已定义 `ApiResponse<T>` 接口
   - 可以为特定接口指定泛型类型：`ApiResponse<LoginResponse>`

## 示例对比

### 改造前

```typescript
// 后端
@Get()
async findAll() {
  const data = await this.service.findAll();
  return {
    code: 0,
    message: 'success',
    data,
  };
}

// 前端
const response = await api.get('/users');
if (response.data.code === 0) {
  console.log(response.data.data);
}
```

### 改造后

```typescript
// 后端 - 更简洁
@Get()
async findAll() {
  return this.service.findAll(); // 直接返回数据
}

// 前端 - 更直接
const response = await api.get('/users');
console.log(response.data); // 直接是业务数据
```

## 测试建议

### 测试成功场景

```bash
curl -X GET http://localhost:3001/api/questions
# 返回:
# {
#   "code": 0,
#   "message": "success",
#   "data": [...],
#   "timestamp": 1698765432100
# }
```

### 测试错误场景

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": ""}'
# 返回:
# {
#   "code": 400,
#   "message": "Validation failed",
#   "data": null,
#   "errors": ["username should not be empty"],
#   "timestamp": 1698765432100
# }
```

## 总结

通过实现统一的响应格式：
- ✅ 简化了后端代码，控制器方法直接返回业务数据
- ✅ 简化了前端代码，不需要重复的格式检查
- ✅ 提供了类型安全的错误处理
- ✅ 统一了错误响应格式
- ✅ 自动处理401跳转等常见场景

