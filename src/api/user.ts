import request from "@/utils/axios";
import type { User } from "@/store/store";
type LoginSchemas = {
  email: string;
  password: string;
};
// 用户登录
export const login = (params: LoginSchemas) => {
  return request.post<{ access_token: string; user: User }>("/user/login", params);
};

type RegisterSchemas = {
  email: string;
  password: string;
  name: string;
};
// 用户注册
export const register = (params: RegisterSchemas) => {
  return request.post<{ access_token: string; user: User }>("/user/create_user", params);
};

// 忘记密码
export const forgetPassword = (params: LoginSchemas) => {
  return request.post<null>("/user/forget_password", params);
};

// 注销账户
export const logout = () => {
  return request.delete<null>("/user/logout");
};

// 上传文件
export const uploadFile = (params: FormData) => {
  return request.post<{ url: string }>("/user/upload_file", params, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 查询用户信息
export const getUserInfoApi = (id: number) => {
  return request.get<User>(`/user/get_user/${id}`);
};

type UpdateUserSchemas = {
  name: string;
  email: string;
  avatar: string;
};

// 更新用户信息
export const updateUserInfo = (params: UpdateUserSchemas) => {
  return request.put<User>("/user/update_user", params);
};
