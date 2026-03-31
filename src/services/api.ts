import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase';

const API_URL = 'http://localhost:3001/api';

export const createAuthenticatedAxios = async (): Promise<AxiosInstance> => {
  const instance = axios.create({
    baseURL: API_URL,
  });

  instance.interceptors.request.use(async (config) => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

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
