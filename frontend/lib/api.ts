import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 统一响应数据结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  errors?: any;
  timestamp: number;
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    // 优先使用 JWT token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 如果没有 JWT token，尝试使用 invite_token
      const inviteToken = sessionStorage.getItem('invite_token');
      if (inviteToken) {
        config.headers['X-Invite-Token'] = inviteToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理返回数据
api.interceptors.response.use(
  (response) => {
    // 后端已经返回统一格式: { code, message, data, timestamp }
    const apiResponse = response.data as ApiResponse;
    
    // 如果 code 为 0，表示成功，直接返回 data 部分
    if (apiResponse.code === 0) {
      // 将 data 部分放到 response.data，方便业务代码直接使用
      response.data = apiResponse.data;
      return response;
    }
    
    // 如果 code 不为 0，表示业务错误，抛出错误
    const error: any = new Error(apiResponse.message || 'Request failed');
    error.code = apiResponse.code;
    error.apiResponse = apiResponse;
    return Promise.reject(error);
  },
  (error: AxiosError) => {
    // 处理 HTTP 错误
    if (error.response) {
      const apiResponse = error.response.data as ApiResponse;
      
      // 401 未授权，清除 token 并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // 包装错误信息
      const enhancedError: any = new Error(
        apiResponse?.message || '请求失败，请稍后重试'
      );
      enhancedError.code = apiResponse?.code || error.response.status;
      enhancedError.errors = apiResponse?.errors;
      enhancedError.status = error.response.status;
      
      return Promise.reject(enhancedError);
    }
    
    // 网络错误或其他错误
    const networkError: any = new Error('网络错误，请检查您的网络连接');
    networkError.code = -1;
    return Promise.reject(networkError);
  }
);

// API 方法
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const usersApi = {
  getAll: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get('/users', { params }),
  getOne: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const questionsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; difficulty?: string; tags?: string; keyword?: string }) =>
    api.get('/questions', { params }),
  getOne: (id: number) => api.get(`/questions/${id}`),
  create: (data: any) => api.post('/questions', data),
  update: (id: number, data: any) => api.patch(`/questions/${id}`, data),
  delete: (id: number) => api.delete(`/questions/${id}`),
  batchDelete: (ids: number[]) => api.post('/questions/batch-delete', { ids }),
  importJson: (data: any) => api.post('/questions/import', data),
  importFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/questions/import/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getStatistics: () => api.get('/questions/statistics'),
};

export const tagsApi = {
  getAll: (params?: { category?: string; parentId?: number }) =>
    api.get('/question-tags', { params }),
  getTree: () => api.get('/question-tags/tree'),
  getOne: (id: number) => api.get(`/question-tags/${id}`),
  create: (data: any) => api.post('/question-tags', data),
  update: (id: number, data: any) => api.patch(`/question-tags/${id}`, data),
  delete: (id: number) => api.delete(`/question-tags/${id}`),
};

export const interviewsApi = {
  getSessions: () => api.get('/interviews/sessions'),
  getSession: (id: number) => api.get(`/interviews/sessions/${id}`),
  createSession: (data: any) => api.post('/interviews/sessions', data),
  startSession: (id: number) => api.patch(`/interviews/sessions/${id}/start`),
  completeSession: (id: number) =>
    api.patch(`/interviews/sessions/${id}/complete`),
  getTemplates: () => api.get('/interviews/templates'),
  getTemplate: (id: number) => api.get(`/interviews/templates/${id}`),
  createTemplate: (data: any) => api.post('/interviews/templates', data),
  // 邀请链接相关
  getSessionByInvite: (token: string) => api.get(`/interviews/invite/${token}`),
  joinSessionByInvite: (token: string) => api.post(`/interviews/invite/${token}/join`),
  resendInvite: (id: number) => api.post(`/interviews/sessions/${id}/resend-invite`),
  // HR专用功能
  getHrStatistics: () => api.get('/interviews/hr/statistics'),
  getAllSessionsForHr: () => api.get('/interviews/hr/sessions'),
  createBatchSessions: (sessions: any[]) => api.post('/interviews/hr/sessions/batch', { sessions }),
  getCandidates: () => api.get('/interviews/hr/candidates'),
  cancelSession: (id: number) => api.patch(`/interviews/sessions/${id}/cancel`),
};

export const submissionsApi = {
  getAll: (params?: { sessionId?: number; userId?: number; questionId?: number }) =>
    api.get('/submissions', { params }),
  getOne: (id: number) => api.get(`/submissions/${id}`),
  create: (data: any) => api.post('/submissions', data),
};

export const reportsApi = {
  generate: (sessionId: number) =>
    api.post(`/reports/generate/${sessionId}`),
  getBySession: (sessionId: number) =>
    api.get(`/reports/session/${sessionId}`),
  updateScore: (submissionId: number, data: { score: number; feedback: string }) =>
    api.patch(`/reports/score/${submissionId}`, data),
};

export const resumesApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    jobId?: number;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get('/resumes', { params }),
  getOne: (id: number) => api.get(`/resumes/${id}`),
  create: (data: any) => api.post('/resumes', data),
  update: (id: number, data: any) => api.patch(`/resumes/${id}`, data),
  delete: (id: number) => api.delete(`/resumes/${id}`),
  getStatistics: () => api.get('/resumes/statistics'),
};

