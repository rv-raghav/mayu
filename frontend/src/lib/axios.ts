import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required for sending/receiving httpOnly refresh token cookies
});

// Request interceptor: attach accessToken
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401s and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token using httpOnly cookie
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        });
        
        if (data.success && data.data?.accessToken) {
          useAuthStore.getState().setAccessToken(data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, user must log in again
        useAuthStore.getState().clearAuth();
        // optionally redirect to /signin here or let ProtectedRoute handle it
      }
    }
    return Promise.reject(error);
  }
);
