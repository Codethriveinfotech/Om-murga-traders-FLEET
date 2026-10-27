import axios from 'axios';
import * as SecureStore from '../utils/storage';
import { useAuthStore } from '../store/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://vehicletrackingapp-fdy2.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Access Token to all request headers
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('ft_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept Responses to process auto refresh token flow on 401 Authentication Failures
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('ft_refresh_token');
        if (!refreshToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }

        // Request refresh token path
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (res.status === 200) {
          const { user, accessToken, newRefreshToken } = res.data.data;
          await useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);
