import request from "@/utils/axios";
type LoginSchemas = {
  email: string;
  password: string;
};
// 用户登录
export const login = (params: LoginSchemas) => {
  return request.post("/user/login", params);
};

type RegisterSchemas = {
  email: string;
  password: string;
  name: string;
};
// 用户注册
export const register = (params: RegisterSchemas) => {
  return request.post("/user/create_user", params);
};

// 忘记密码
export const forgetPassword = (params: LoginSchemas) => {
  return request.post("/user/forget_password", params);
};

// 注销账户
export const logout = () => {
  return request.delete("/user/logout");
};

// 上传文件
export const uploadFile = (params: FormData) => {
  return request.post("/user/upload_file", params, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

type UpdateUserSchemas = {
  name: string;
  email: string;
  avatar: string;
};

// 更新用户信息
export const updateUserInfo = (params: UpdateUserSchemas) => {
  return request.put("/user/update_user", params);
};
