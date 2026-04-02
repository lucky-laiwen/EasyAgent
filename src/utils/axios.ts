// axios.ts
import axios from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import EAMessage from "@/components/EAMessage";
// 通用 API 响应结构
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  status: number;
}

const request = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
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

// 响应拦截器（保留 AxiosResponse<ApiResponse<T>>）
request.interceptors.response.use(
  <T>(
    response: AxiosResponse<ApiResponse<T>>,
  ): AxiosResponse<ApiResponse<T>> => {
    return response;
  },
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

// ✅ 统一封装：返回 ApiResponse<T>
export const apiRequest = async <T = unknown>(
  config: AxiosRequestConfig,
): Promise<ApiResponse<T>> => {
  const res: AxiosResponse<ApiResponse<T>> = await request(config);
  return res.data;
};

export default request;
