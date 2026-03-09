import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/utils/logger';

const DEFAULT_PROD_API_URL = 'https://ireport-final-backend-production.up.railway.app/api';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_PROD_API_URL).replace(/\/$/, '');

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    options?: { skipAuth?: boolean }
  ): Promise<T> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, options?: any) {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  post<T>(endpoint: string, data?: any, options?: any) {
    return this.request<T>('POST', endpoint, data, options);
  }

  put<T>(endpoint: string, data?: any, options?: any) {
    return this.request<T>('PUT', endpoint, data, options);
  }

  delete<T>(endpoint: string, options?: any) {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  patch<T>(endpoint: string, data?: any, options?: any) {
    return this.request<T>('PATCH', endpoint, data, options);
  }
}

export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: any) => apiClient.post('/auth/register', data),
  getProfile: () => apiClient.get('/auth/profile'),
};

// Reports API
export const reportsApi = {
  createReport: (data: any) => apiClient.post('/reports', data),
  getReports: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/reports${query ? `?${query}` : ''}`);
  },
  getReportById: (id: string) => apiClient.get(`/reports/${id}`),
  updateReportStatus: (id: string, data: any) =>
    apiClient.put(`/reports/${id}/status`, data),
  getStudentReports: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/reports/student/my-reports${query ? `?${query}` : ''}`);
  },
};

// Live Incidents API
export const liveIncidentsApi = {
  createIncident: (data: any) => apiClient.post('/live-incidents', data),
  getIncidents: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/live-incidents${query ? `?${query}` : ''}`);
  },
  respondToIncident: (incidentId: string, data: any) =>
    apiClient.post(`/live-incidents/${incidentId}/respond`, data),
  resolveIncident: (incidentId: string, data: any) =>
    apiClient.post(`/live-incidents/${incidentId}/resolve`, data),
  removeResponder: (incidentId: string, userId: string) =>
    apiClient.delete(`/live-incidents/${incidentId}/responders/${userId}`),
};

// Students API
export const studentsApi = {
  getStudents: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/students${query ? `?${query}` : ''}`);
  },
  createStudent: (data: any) => apiClient.post('/students', data),
  updateStudent: (id: string, data: any) => apiClient.put(`/students/${id}`, data),
  deleteStudent: (id: string) => apiClient.delete(`/students/${id}`),
  getGradeLevels: () => apiClient.get('/students/grade-levels'),
  getSections: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/students/sections${query ? `?${query}` : ''}`);
  },
};

// Buildings API
export const buildingsApi = {
  getBuildings: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/buildings${query ? `?${query}` : ''}`);
  },
  createBuilding: (data: any) => apiClient.post('/buildings', data),
  updateBuilding: (id: string, data: any) => apiClient.put(`/buildings/${id}`, data),
  deleteBuilding: (id: string) => apiClient.delete(`/buildings/${id}`),
};
