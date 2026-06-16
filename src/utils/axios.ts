// axios.ts
import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import EAMessage from "@/components/EAMessage";

// 通用 API 响应结构
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  status: number;
}

const instance = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 100000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    config.headers["Accept-Language"] = "zh";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：自动解包，直接返回 ApiResponse<T>
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.status === 401) {
      window.location.href = "/login";
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    EAMessage.error(error.message);
    return Promise.reject(error);
  },
);

// 类型安全的请求封装，所有方法直接返回 ApiResponse<T>
const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    instance.get(url, config) as unknown as Promise<ApiResponse<T>>,

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post(url, data, config) as unknown as Promise<ApiResponse<T>>,

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.put(url, data, config) as unknown as Promise<ApiResponse<T>>,

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    instance.delete(url, config) as unknown as Promise<ApiResponse<T>>,
};

// ✅ 统一封装：返回 ApiResponse<T>
export const apiRequest = async <T = unknown>(
  config: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  return instance(config) as unknown as Promise<ApiResponse<T>>;
};

export default request;
