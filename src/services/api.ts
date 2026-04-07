import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase';

const API_URL = 'http://localhost:3001/api';

export const createAuthenticatedAxios = async (): Promise<AxiosInstance> => {
  const instance = axios.create({
    baseURL: API_URL,
  });

  instance.interceptors.request.use(async (config) => {
    if (auth.currentUser) {
      try {
        // Force refresh token to ensure it's valid
        const token = await auth.currentUser.getIdToken(true);
        console.log('Adding auth token to request:', token ? token.substring(0, 20) + '...' : 'no token');
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
        throw new Error('Authentication failed - please log in again');
      }
    } else {
      console.warn('No current user found for authentication');
      throw new Error('User not authenticated');
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Response Error:', error);
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be invalid');
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Wardrobe API
export const wardrobeAPI = {
  getAll: async () => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.get('/wardrobe');
  },
  create: async (data: { name: string }) => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.post('/wardrobe', data);
  },
  update: async (id: string, data: any) => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.put(`/wardrobe/${id}`, data);
  },
  delete: async (id: string) => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.delete(`/wardrobe/${id}`);
  },
};

// Items API
export const itemsAPI = {
  getAll: async () => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.get('/items');
  },
  create: async (data: {
    name: string;
    category: string;
    color?: string;
    material?: string;
    imageUrl?: string;
  }) => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.post('/items', data);
  },
  update: async (id: string, data: any) => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.put(`/items/${id}`, data);
  },
  delete: async (id: string) => {
    const axiosInstance = await createAuthenticatedAxios();
    return axiosInstance.delete(`/items/${id}`);
  },
};

// User API
export const userAPI = {
  getMe: async () => {
    console.log('userAPI.getMe called');
    const axiosInstance = await createAuthenticatedAxios();
    console.log('Making GET request to /users/me');
    const response = await axiosInstance.get('/users/me');
    console.log('userAPI.getMe response:', response);
    return response;
  },
  updateProfile: async (data: { displayName?: string; email?: string }) => {
    console.log('userAPI.updateProfile called with:', data);
    try {
      const axiosInstance = await createAuthenticatedAxios();
      console.log('Making POST request to /users with headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [token]'
      });
      const response = await axiosInstance.post('/users', data);
      console.log('userAPI.updateProfile response:', response);
      return response;
    } catch (error: any) {
      console.error('userAPI.updateProfile error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error;
    }
  },
};
