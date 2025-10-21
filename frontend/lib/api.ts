import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，清除 token 并跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
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

export const questionsApi = {
  getAll: (params?: { type?: string; difficulty?: string }) =>
    api.get('/questions', { params }),
  getOne: (id: number) => api.get(`/questions/${id}`),
  create: (data: any) => api.post('/questions', data),
  update: (id: number, data: any) => api.patch(`/questions/${id}`, data),
  delete: (id: number) => api.delete(`/questions/${id}`),
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
};

export const submissionsApi = {
  getAll: (params?: { sessionId?: number; userId?: number }) =>
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

